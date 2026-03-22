import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require("csv-parse/sync") as {
  parse: (input: string, options: any) => unknown;
};

import { PrismaService } from "@/prisma/prisma.service";
import { GroupsService } from "@/groups/groups.service";
import { SubGroupsService } from "@/subgroups/subgroups.service";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";
import { ContactStatus } from "@/contacts/type/contact-status.enum";
import { ImportContactsCsvResponseDto } from "./dto/import-contacts.response.dto";

type ImportContactsFromCsvArgs = {
  groupName: string;
  csvBuffer: Buffer;
  dryRun?: boolean;
  debug?: boolean;
};

type MinimalGroup = { id: string; name: string };
type MinimalSubGroup = { id: string; name: string; groupId: string };

function cellToString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint")
    return String(v);
  return "";
}

function normalizeHeader(s: unknown): string {
  return cellToString(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function normalizeEmail(s: unknown): string {
  const v = cellToString(s).trim().toLowerCase();
  if (!v) return "";
  if (v === "x") return "";
  return v.replace(/\s+/g, "");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isBlankCell(v: unknown): boolean {
  const s = cellToString(v).replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, "");
  return s.length === 0;
}

function normalizePhone(raw: unknown): string {
  const v = cellToString(raw).trim();
  if (!v) return "";
  return v.replace(/[^\d+]/g, "");
}

function splitNameIfNeeded(
  first: string,
  last: string,
): { firstName: string; lastName: string } {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (l) return { firstName: f, lastName: l };

  const parts = f.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const lastName = parts.pop()!;
    const firstName = parts.join(" ");
    return { firstName, lastName };
  }

  return { firstName: f, lastName: "UNKNOWN" };
}

function rowLooksLikeColumnsHeader(row: unknown[]): boolean {
  const cells = (row ?? []).map((c) => normalizeHeader(c));
  const hasMail =
    cells.includes("mail") ||
    cells.includes("email") ||
    cells.includes("e-mail");
  const hasPrenom = cells.includes("prenom") || cells.includes("firstname");
  const hasNom = cells.includes("nom") || cells.includes("lastname");
  return hasMail && (hasPrenom || hasNom);
}

function parseCsvWithBestDelimiter(csvText: string): {
  delimiter: string;
  rows: string[][];
} {
  const candidates: Array<string> = [",", ";", "\t"];

  let best: {
    delimiter: string;
    rows: string[][];
    score: number;
  } | null = null;

  for (const d of candidates) {
    try {
      const parsed = parse(csvText, {
        delimiter: d,
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      if (!Array.isArray(parsed) || parsed.length === 0) continue;

      const rows: string[][] = (parsed as unknown[]).map((r) =>
        Array.isArray(r) ? r.map((x) => cellToString(x)) : [],
      );

      const header = rows[0] ?? [];
      const headerNorm = header.map((h) => normalizeHeader(h));
      const idxMail = headerNorm.findIndex((h) =>
        ["mail", "email", "e-mail"].includes(h),
      );

      const score = (idxMail >= 0 ? 1000 : 0) + header.length;

      if (!best || score > best.score) {
        best = { delimiter: d, rows, score };
      }
    } catch {
      // ignore
    }
  }

  if (!best) {
    throw new BadRequestException(
      "Unable to parse CSV (no delimiter matched).",
    );
  }

  return { delimiter: best.delimiter, rows: best.rows };
}

function allBlankExcept(row: string[], keepIndex: number): boolean {
  return (row ?? []).every(
    (cell, idx) => idx === keepIndex || isBlankCell(cell),
  );
}

@Injectable()
export class ImportContactsService {
  private readonly logger = new Logger(ImportContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groups: GroupsService,
    private readonly subGroups: SubGroupsService,
    private readonly brevo: BrevoMarketingService,
  ) {}

  private async ensureGroupByName(name: string): Promise<MinimalGroup> {
    const trimmed = (name ?? "").trim();
    if (!trimmed) throw new BadRequestException("groupName is required");

    const existing = await this.prisma.group.findFirst({
      where: { name: trimmed },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    if (existing) return existing;

    const created = await this.groups.create({ name: trimmed });
    return { id: created.id, name: created.name };
  }

  private async ensureSubGroupByName(
    groupId: string,
    name: string,
  ): Promise<{ subGroup: MinimalSubGroup; created: boolean }> {
    const trimmed = (name ?? "").trim();
    if (!trimmed) throw new BadRequestException("subGroup name is empty");

    const existing = await this.prisma.subGroup.findFirst({
      where: { groupId, name: trimmed },
      select: { id: true, name: true, groupId: true },
      orderBy: { id: "asc" },
    });

    if (existing) {
      return {
        subGroup: {
          id: existing.id,
          name: existing.name,
          groupId: existing.groupId,
        },
        created: false,
      };
    }

    const created = await this.subGroups.create({ groupId, name: trimmed });
    if (!created) {
      throw new InternalServerErrorException(
        "SubGroupsService.create returned null",
      );
    }

    return {
      subGroup: {
        id: created.id,
        name: created.name,
        groupId: created.groupId,
      },
      created: true,
    };
  }

  async importContactsFromCsv(
    args: ImportContactsFromCsvArgs,
  ): Promise<ImportContactsCsvResponseDto> {
    const dryRun = !!args.dryRun;
    const debug = !!args.debug;
    const dlog = (msg: string) => {
      if (debug) this.logger.log(`[IMPORT_DEBUG] ${msg}`);
    };

    const groupName = (args.groupName ?? "").trim();

    if (!groupName) throw new BadRequestException("groupName is required");
    if (!args.csvBuffer?.length)
      throw new BadRequestException("csv file is empty");

    const csvText = args.csvBuffer.toString("utf-8");
    const { delimiter, rows } = parseCsvWithBestDelimiter(csvText);

    if (rows.length < 2) {
      throw new BadRequestException(
        "CSV must have at least a header row + data",
      );
    }

    const headerRow = rows[0].map((h) => normalizeHeader(h));
    const colIndex = (aliases: string[]) =>
      headerRow.findIndex((h) => aliases.includes(h));

    const idxLabel = colIndex(["ville", "entreprise", "societe", "company"]);
    const labelIndex = idxLabel >= 0 ? idxLabel : 0;

    const idxMail = colIndex(["mail", "email", "e-mail"]);
    const idxPrenom = colIndex(["prenom", "firstname"]);
    const idxNom = colIndex(["nom", "lastname"]);
    const idxFonction = colIndex(["fonction", "function"]);
    const idxPortable = colIndex(["portable", "mobile", "gsm"]);
    const idxFixe = colIndex(["fixe", "telephone", "phone"]);
    const idxAccuse = colIndex(["accuse"]);
    const idxContacte = colIndex(["contacte"]);

    if (idxMail < 0) {
      throw new BadRequestException(
        `CSV must contain a "Mail" column. Found: ${rows[0].join(" | ")}`,
      );
    }

    const group = await this.ensureGroupByName(groupName);

    let currentSubGroup: MinimalSubGroup | null = null;

    const stats: ImportContactsCsvResponseDto = {
      dryRun,
      group: { id: group.id, name: group.name },
      delimiter,

      subGroupsCreated: 0,
      subGroupsReused: 0,

      contactsUpserted: 0,
      contactsSkippedNoEmail: 0,
      contactsSkippedInvalidEmail: 0,
      contactsSkippedNoSubGroup: 0,

      // Brevo n'est plus sync "par subgroup list" pendant l'import
      brevoPrepared: 0,
      errors: [],
    };

    const subGroupCache = new Map<string, MinimalSubGroup>();

    const getLabel = (row: string[]) => (row?.[labelIndex] ?? "").trim();

    const isSubGroupHeaderRow = (row: string[]) => {
      const label = getLabel(row);
      if (!label) return false;
      return allBlankExcept(row, labelIndex);
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      if (!row.length) continue;

      if (rowLooksLikeColumnsHeader(row)) continue;

      // 1) Subgroup header
      if (isSubGroupHeaderRow(row)) {
        const candidate = getLabel(row);
        if (!candidate) continue;

        const cacheKey = `${group.id}:${candidate}`;
        const cached = subGroupCache.get(cacheKey);

        if (cached) {
          currentSubGroup = cached;
          stats.subGroupsReused++;
          continue;
        }

        if (dryRun) {
          const sg: MinimalSubGroup = {
            id: "__dryRun__",
            name: candidate,
            groupId: group.id,
          };
          currentSubGroup = sg;
          subGroupCache.set(cacheKey, sg);
          stats.subGroupsCreated++;
          continue;
        }

        try {
          const { subGroup: sg, created } = await this.ensureSubGroupByName(
            group.id,
            candidate,
          );

          currentSubGroup = sg;
          subGroupCache.set(cacheKey, sg);

          if (created) stats.subGroupsCreated++;
          else stats.subGroupsReused++;
        } catch (e: any) {
          stats.errors.push({
            row: i + 1,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            reason: `SubGroup ensure failed: ${e?.message ?? String(e)}`,
          });
        }

        continue;
      }

      // 2) Contact row
      const emailInMail = normalizeEmail(idxMail >= 0 ? row[idxMail] : "");
      const emailAnywhere =
        (row ?? [])
          .map((c) => normalizeEmail(c))
          .find((e) => e && isValidEmail(e)) ?? "";

      const email = emailInMail || emailAnywhere;

      if (!email) {
        stats.contactsSkippedNoEmail++;
        continue;
      }
      if (!isValidEmail(email)) {
        stats.contactsSkippedInvalidEmail++;
        continue;
      }

      if (!currentSubGroup) {
        const inferred = getLabel(row);
        if (inferred) {
          const cacheKey = `${group.id}:${inferred}`;
          const cached = subGroupCache.get(cacheKey);
          if (cached) currentSubGroup = cached;
        }
      }

      if (!currentSubGroup || currentSubGroup.id === "__dryRun__") {
        stats.contactsSkippedNoSubGroup++;
        continue;
      }

      const prenom = idxPrenom >= 0 ? (row[idxPrenom] ?? "").trim() : "";
      const nom = idxNom >= 0 ? (row[idxNom] ?? "").trim() : "";
      const fonction = idxFonction >= 0 ? (row[idxFonction] ?? "").trim() : "";

      const portable = idxPortable >= 0 ? row[idxPortable] : "";
      const fixe = idxFixe >= 0 ? row[idxFixe] : "";

      const accuse = idxAccuse >= 0 ? (row[idxAccuse] ?? "").trim() : "";
      const contacte = idxContacte >= 0 ? (row[idxContacte] ?? "").trim() : "";

      const { firstName, lastName } = splitNameIfNeeded(prenom, nom);
      const phones = [normalizePhone(portable), normalizePhone(fixe)].filter(
        Boolean,
      );

      try {
        if (dryRun) {
          stats.contactsUpserted++;
          continue;
        }

        await this.prisma.contact.upsert({
          where: { email },
          create: {
            firstName,
            lastName,
            function: fonction ?? "",
            status: ContactStatus.NO_EXCHANGE,
            email,
            phoneNumber: phones,
            lastContact: contacte ?? "",
            lastEmail: accuse ?? "",
            groupId: group.id,
            subGroupId: currentSubGroup.id,
          },
          update: {
            firstName,
            lastName,
            function: fonction ?? "",
            phoneNumber: phones,
            lastContact: contacte ?? "",
            lastEmail: accuse ?? "",
            groupId: group.id,
            subGroupId: currentSubGroup.id,
          },
        });

        stats.contactsUpserted++;
      } catch (e: any) {
        stats.errors.push({
          row: i + 1,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          reason: `Contact upsert failed: ${e?.message ?? String(e)}`,
        });
      }
    }

    dlog(
      `DONE upserted=${stats.contactsUpserted} skipNoEmail=${stats.contactsSkippedNoEmail} skipInvalidEmail=${stats.contactsSkippedInvalidEmail} skipNoSubGroup=${stats.contactsSkippedNoSubGroup} errors=${stats.errors.length}`,
    );

    return stats;
  }
}
