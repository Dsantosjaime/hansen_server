import { Injectable } from "@nestjs/common";
import { ContactsService } from "src/contacts/contacts.service";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";
import { SubmitLinkedinScrapeDto } from "./dto/submit-linkedin-scrape.dto";
import { SubGroupsService } from "@/subgroups/subgroups.service";
import { ContactStatus } from "@/contacts/type/contact-status.enum";
import { PluginParamsService } from "@/plugin-params/plugin-params.service";
import { PluginRestrictedParamType } from "generated/prisma/enums";
import { PluginParam } from "generated/prisma/client";
import { buildEmailFromTemplate } from "@/common/email/email-address.util";

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

/** Normalisation token (pour comparer des mots) */
function normalizeToken(s: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Tokenise un texte en mots, puis normalise chaque token */
function tokenizeComparable(input: string): string[] {
  const rawTokens = String(input ?? "").match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+/g) ?? [];
  return rawTokens.map(normalizeToken).filter(Boolean);
}

/** Recherche si needle (tokens) apparaît comme séquence contiguë dans haystack (tokens) */
function containsTokenSequence(haystack: string[], needle: string[]): boolean {
  if (!needle.length) return false;
  if (needle.length > haystack.length) return false;

  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function buildRestrictionsIndex(pluginParams: PluginParam[]) {
  // NAME: mots interdits
  const blockedNameTokens = new Set<string>();
  // FUNCTION: phrases interdites (séquence de tokens, inclut le cas 1 mot)
  const blockedFunctionPhrases: string[][] = [];

  for (const p of pluginParams ?? []) {
    const tokens = tokenizeComparable(p.name);
    if (!tokens.length) continue;

    if (p.type === PluginRestrictedParamType.NAME) {
      // Si un param NAME contient plusieurs mots, on bloque chacun des mots.
      for (const t of tokens) blockedNameTokens.add(t);
    }

    if (p.type === PluginRestrictedParamType.FUNCTION) {
      // La restriction est une phrase: on bloque si la phrase apparaît (tokens contigus) dans la fonction.
      blockedFunctionPhrases.push(tokens);
    }
  }

  return { blockedNameTokens, blockedFunctionPhrases };
}

@Injectable()
export class ScrapService {
  constructor(
    private readonly contacts: ContactsService,
    private readonly subGroups: SubGroupsService,
    private readonly brevo: BrevoMarketingService,
    private readonly pluginParams: PluginParamsService,
  ) {}

  // Cache optionnel (évite de requêter la DB à chaque scrap)
  private restrictionsCache: {
    at: number;
    value: ReturnType<typeof buildRestrictionsIndex>;
  } | null = null;

  private async getRestrictionsIndex() {
    const now = Date.now();
    const TTL = 60_000; // 1 minute (ajuste si besoin)

    if (this.restrictionsCache && now - this.restrictionsCache.at < TTL) {
      return this.restrictionsCache.value;
    }

    // PluginParams globaux => on charge tout
    const params = await this.pluginParams.findAll();
    const index = buildRestrictionsIndex(params);

    this.restrictionsCache = { at: now, value: index };
    return index;
  }

  private isBlockedByRestrictions(
    candidate: { firstName: string; lastName: string; fn: string },
    restrictions: ReturnType<typeof buildRestrictionsIndex>,
  ): boolean {
    // 1) NAME : token par token sur "firstName lastName"
    const nameTokens = tokenizeComparable(
      `${candidate.firstName} ${candidate.lastName}`,
    );

    for (const t of nameTokens) {
      if (restrictions.blockedNameTokens.has(t)) return true;
    }

    // 2) FUNCTION : la fonction contient une "phrase" interdite (séquence contiguë de tokens)
    const fnTokens = tokenizeComparable(candidate.fn);

    for (const phraseTokens of restrictions.blockedFunctionPhrases) {
      if (containsTokenSequence(fnTokens, phraseTokens)) return true;
    }

    return false;
  }

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

    // 1bis) Filtrage par restrictions (PluginParams globaux)
    const restrictions = await this.getRestrictionsIndex();
    const filteredCandidates = candidates.filter(
      (c) =>
        !this.isBlockedByRestrictions(
          { firstName: c.firstName, lastName: c.lastName, fn: c.fn },
          restrictions,
        ),
    );

    if (!filteredCandidates.length) return 0;

    // 2) Récupère en une fois les emails déjà existants en DB
    const existingEmails = await this.contacts.findExistingEmails(
      filteredCandidates.map((c) => c.email),
    );

    // 3) Évite aussi les doublons dans le même scrap
    const seenInBatch = new Set<string>();

    let processed = 0;

    for (const c of filteredCandidates) {
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
