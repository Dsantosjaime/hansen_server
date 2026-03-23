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
    .replace(/[^a-z0-9]+/g, ""); // garde alphanum (sans points)
}

function takeN(s: string, n?: number): string {
  if (!s) return "";
  if (!n || n <= 0) return s;
  return s.slice(0, n);
}

function cleanupLocalPart(local: string): string {
  return local
    .replace(/[._-]{2,}/g, (m) => m[0]) // "..." -> "."
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "");
}

function parseProspectNameParts(names: string[]): {
  firstName: string;
  lastName: string;
  tokens: string[];
  toVerify: boolean;
} {
  const tokens = (names ?? [])
    .flatMap((x) =>
      String(x ?? "")
        .trim()
        .split(/\s+/),
    )
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return { firstName: "", lastName: "", tokens: [], toVerify: false };
  }

  const firstName = tokens[0];
  const lastName = tokens.slice(1).join(" "); // "dos santos"
  const toVerify = tokens.length > 2;

  return { firstName, lastName, tokens, toVerify };
}

export function buildEmailFromTemplate(params: {
  firstName: string;
  lastName: string; // peut contenir des espaces ("dos santos")
  domain: string;
  extension: string;
  pattern: string; // ex "{first:1}.{last}"
}): string {
  const domain = params.domain;
  const ext = params.extension;
  if (!domain || !ext) return "";

  const tokenRe = /\{(first|last)(?::(\d+))?\}/g;

  const local = params.pattern.replace(
    tokenRe,
    (_m, key: "first" | "last", nStr?: string) => {
      const n = nStr ? Number(nStr) : undefined;
      const raw = key === "first" ? params.firstName : params.lastName;
      const value = normalizePart(raw); // "dos santos" -> "dossantos"
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

    // 1) Prépare les candidats (email + infos)
    const candidates = prospects
      .map((p) => {
        const parsed = parseProspectNameParts(p.names ?? []);
        if (!parsed.firstName) return null;

        const email = buildEmailFromTemplate({
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          domain: selection.domain,
          extension: selection.extension,
          pattern: selection.pattern,
        })
          .trim()
          .toLowerCase();

        if (!email) return null;

        const fn = (p.function ?? "").trim();

        return {
          email,
          firstName: parsed.firstName.trim(),
          lastName: (parsed.lastName || "").trim(),
          fn,
          toVerify: parsed.toVerify,
        };
      })
      .filter(
        (
          x,
        ): x is {
          email: string;
          firstName: string;
          lastName: string;
          fn: string;
          toVerify: boolean;
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

      // A) Upsert Brevo CONTACT (sans list)
      await this.brevo.upsertContact({
        email: c.email,
        attributes: {
          FIRSTNAME: c.firstName,
          LASTNAME: c.lastName,
          FUNCTION: c.fn,
          STATUS: "ACTIF",

          // utile pour retrouver l'origine côté Brevo, sans créer de list
          SUBGROUP_ID: selection.subGroupId,
          GROUP_ID: selection.groupId,
        },
      });

      // B) Upsert BDD (nouveaux emails uniquement)
      await this.contacts.upsertFromScrap({
        groupId: selection.groupId,
        subGroupId: selection.subGroupId,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName || "UNKNOWN",
        function: c.fn,
        status: c.toVerify
          ? ContactStatus.TO_VERIFY
          : ContactStatus.NO_EXCHANGE,
      });

      processed++;
    }

    return processed;
  }
}
