import { Injectable } from "@nestjs/common";
import { ContactsService } from "src/contacts/contacts.service";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";
import { SubmitLinkedinScrapeDto } from "./dto/submit-linkedin-scrape.dto";
import { SubGroupsService } from "@/subgroups/subgroups.service";
import { ContactStatus } from "@/contacts/type/contact-status.enum";

function normalizePart(s: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z0-9]+/g, ""); // garde alphanum (ici sans points)
}

function takeN(s: string, n?: number): string {
  if (!s) return "";
  if (!n || n <= 0) return s;
  return s.slice(0, n);
}

function cleanupLocalPart(local: string): string {
  // évite "..", "--", "__", ".-", etc + trim séparateurs
  return local
    .replace(/[._-]{2,}/g, (m) => m[0]) // "..." -> "."
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "");
}

export function buildEmailFromTemplate(params: {
  names: string[];
  domain: string;
  extension: string;
  pattern: string; // ex "{first:1}.{last}"
}): string {
  const firstRaw = params.names?.[0] ?? "";
  const lastRaw = params.names?.[1] ?? "";

  const domain = params.domain;
  const ext = params.extension;

  if (!domain || !ext) return "";

  const tokenRe = /\{(first|last)(?::(\d+))?\}/g;

  const local = params.pattern.replace(
    tokenRe,
    (_m, key: "first" | "last", nStr?: string) => {
      const n = nStr ? Number(nStr) : undefined;

      const value =
        key === "first" ? normalizePart(firstRaw) : normalizePart(lastRaw);
      return takeN(value, n);
    },
  );

  const cleanedLocal = cleanupLocalPart(local);
  if (!cleanedLocal) return "";

  return `${cleanedLocal}@${domain}.${ext}`;
}

@Injectable()
export class ScrapService {
  constructor(
    private readonly contacts: ContactsService,
    private readonly subGroups: SubGroupsService,
    private readonly brevo: BrevoMarketingService,
  ) {}

  async submitLinkedin(dto: SubmitLinkedinScrapeDto): Promise<number> {
    const { selection, prospects } = dto;
    if (!prospects?.length) return 0;

    // Validation group/subGroup
    await this.subGroups.assertGroupAndSubGroup(
      selection.groupId,
      selection.subGroupId,
    );

    const listId = await this.brevo.ensureBrevoListForSubGroup(
      selection.subGroupId,
    );

    // 1) Prépare les candidats (email + infos), ignore emails invalides
    const candidates = prospects
      .map((p) => {
        const email = buildEmailFromTemplate({
          names: p.names,
          domain: selection.domain,
          extension: selection.extension,
          pattern: selection.pattern,
        })
          .trim()
          .toLowerCase();

        if (!email) return null;

        const firstName = (p.names?.[0] ?? "").trim();
        const lastName = (p.names?.[1] ?? "").trim();
        const fn = (p.function ?? "").trim();

        return { email, firstName, lastName, fn };
      })
      .filter(
        (
          x,
        ): x is {
          email: string;
          firstName: string;
          lastName: string;
          fn: string;
        } => !!x,
      );

    if (!candidates.length) return 0;

    // 2) Récupère en une fois les emails déjà existants en DB
    const existingEmails = await this.contacts.findExistingEmails(
      candidates.map((c) => c.email),
    );

    // 3) Évite aussi les doublons dans le même scrap
    const seenInBatch = new Set<string>();

    let processed = 0;

    for (const c of candidates) {
      if (existingEmails.has(c.email)) continue;
      if (seenInBatch.has(c.email)) continue;
      seenInBatch.add(c.email);

      // 1) Upsert Brevo dans la liste (provider)
      await this.brevo.upsertContactToList({
        email: c.email,
        listId,
        attributes: {
          FIRSTNAME: c.firstName,
          LASTNAME: c.lastName,
          FUNCTION: c.fn,
          STATUS: "ACTIF",
        },
      });

      // 2) Upsert BDD (mais maintenant uniquement pour les nouveaux emails)
      await this.contacts.upsertFromScrap({
        groupId: selection.groupId,
        subGroupId: selection.subGroupId,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        function: c.fn,
        status: ContactStatus.NO_EXCHANGE,
      });

      processed++;
    }

    return processed;
  }
}
