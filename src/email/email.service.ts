import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";
import { ScheduleSendCampaignDto } from "@/brevo/dto/schedule-send-campaign.dto";
import { MarkTemplateAsSentDto } from "./dto/mark-template-as-sent.dto";
import { randomUUID } from "crypto";

type BrevoWebhookEvent = {
  email?: string;
  event?: string;
  date?: string | number;
  campaignId?: number | string;

  type?: string;
  eventDate?: string | number;
  timestamp?: string | number;
  emailCampaignId?: number | string;
};

function toDate(v: unknown): Date | undefined {
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof v === "number") {
    const d = new Date(v * 1000);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function toInt(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

  private async resolveTargetSubGroupIds(dto: {
    groupIds?: string[];
    subGroupIds?: string[];
  }): Promise<string[]> {
    const set = new Set<string>(dto.subGroupIds ?? []);

    const groupIds = dto.groupIds ?? [];
    if (groupIds.length) {
      const sgs = await this.prisma.subGroup.findMany({
        where: { groupId: { in: groupIds } },
        select: { id: true },
      });
      for (const sg of sgs) set.add(sg.id);
    }

    return [...set];
  }

  private async buildAffected(args: {
    subGroupIds: string[];
    fromBySubGroupId: Map<string, Date | null>;
    countBySubGroupId: Map<string, number>;
  }) {
    const subGroups = await this.prisma.subGroup.findMany({
      where: { id: { in: args.subGroupIds } },
      select: { id: true, name: true, groupId: true },
    });

    const groupIds = [...new Set(subGroups.map((sg) => sg.groupId))];

    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, name: true },
    });

    const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

    const affectedMap = new Map<
      string,
      {
        groupId: string;
        groupName: string;
        subGroups: Array<{
          subGroupId: string;
          subGroupName: string;
          from: Date | null;
          recipientsCount: number;
        }>;
      }
    >();

    for (const sg of subGroups) {
      const groupId = sg.groupId;
      const groupName = groupNameById.get(groupId) ?? "(unknown group)";

      let entry = affectedMap.get(groupId);
      if (!entry) {
        entry = { groupId, groupName, subGroups: [] };
        affectedMap.set(groupId, entry);
      }

      entry.subGroups.push({
        subGroupId: sg.id,
        subGroupName: sg.name,
        from: args.fromBySubGroupId.get(sg.id) ?? null,
        recipientsCount: args.countBySubGroupId.get(sg.id) ?? 0,
      });
    }

    const affected = [...affectedMap.values()]
      .map((g) => ({
        ...g,
        subGroups: g.subGroups.sort((a, b) =>
          a.subGroupName.localeCompare(b.subGroupName),
        ),
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));

    const affectedGroupIds = affected.map((g) => g.groupId);
    const affectedSubGroupIds = affected.flatMap((g) =>
      g.subGroups.map((sg) => sg.subGroupId),
    );

    return { affected, affectedGroupIds, affectedSubGroupIds };
  }

  /**
   * ✅ Factorisation: récupère cursors existants + map "from"
   */
  private async getFromBySubGroupId(args: {
    templateId: number;
    subGroupIds: string[];
  }) {
    const cursors = await this.prisma.templateSubGroupCursor.findMany({
      where: {
        templateId: args.templateId,
        subGroupId: { in: args.subGroupIds },
      },
      select: { subGroupId: true, lastSentAt: true },
    });

    const lastSentAtBySubGroupId = new Map<string, Date>();
    for (const c of cursors)
      lastSentAtBySubGroupId.set(c.subGroupId, c.lastSentAt);

    const fromBySubGroupId = new Map<string, Date | null>();
    for (const sgId of args.subGroupIds) {
      fromBySubGroupId.set(sgId, lastSentAtBySubGroupId.get(sgId) ?? null);
    }

    return { fromBySubGroupId, lastSentAtBySubGroupId };
  }

  /**
   * ✅ Factorisation: mise à jour des cursors (blocage new-only)
   */
  private async upsertTemplateSubGroupCursors(args: {
    templateId: number;
    subGroupIds: string[];
    lastSentAt: Date;
  }) {
    const ops = args.subGroupIds.map((subGroupId) =>
      this.prisma.templateSubGroupCursor.upsert({
        where: {
          templateId_subGroupId: {
            templateId: args.templateId,
            subGroupId,
          },
        },
        create: {
          templateId: args.templateId,
          subGroupId,
          lastSentAt: args.lastSentAt,
        },
        update: { lastSentAt: args.lastSentAt },
      }),
    );

    await this.prisma.$transaction(ops);
    return { updatedCount: args.subGroupIds.length };
  }

  /**
   * ✅ IMPORTANT: Mongo unique index n'autorise pas plusieurs docs sans brevoCampaignId.
   * Donc pour les campagnes MANUAL, on génère un "fake" brevoCampaignId unique.
   */
  private makeManualCampaignId(templateId: number) {
    return `MANUAL:T${templateId}:${randomUUID()}`;
  }

  /**
   * ✅ NEW: marquer comme déjà envoyé (MANUAL) + créer EmailSend "manuel"
   */
  async markMarketingTemplateAsSent(dto: MarkTemplateAsSentDto) {
    // Vérifie que le template existe + récupère subject (affichage)
    const tpl = await this.brevoMarketing.getTemplate(dto.templateId);
    const subject = tpl.subject ?? "(no subject)";

    const resolved = await this.resolveTargetSubGroupIds(dto);
    if (!resolved.length) {
      throw new NotFoundException("Empty selection (no subGroups resolved).");
    }

    // Valide existence subgroups
    const existing = await this.prisma.subGroup.findMany({
      where: { id: { in: resolved } },
      select: { id: true },
    });
    const subGroupIds = existing.map((x) => x.id);
    if (!subGroupIds.length) {
      throw new NotFoundException("No valid subGroups found for selection.");
    }

    const existingSet = new Set(subGroupIds);
    const notFoundSubGroupIds = resolved.filter((id) => !existingSet.has(id));

    // "from" basé sur les cursors existants
    const { fromBySubGroupId, lastSentAtBySubGroupId } =
      await this.getFromBySubGroupId({
        templateId: dto.templateId,
        subGroupIds,
      });

    // recipientsCount = nb de "nouveaux" qui auraient été ciblés
    const counts = await Promise.all(
      subGroupIds.map(async (sgId) => {
        const last = lastSentAtBySubGroupId.get(sgId);
        const count = await this.prisma.contact.count({
          where: {
            subGroupId: sgId,
            ...(last ? { createdAt: { gt: last } } : {}),
          },
        });
        return [sgId, count] as const;
      }),
    );

    const countBySubGroupId = new Map<string, number>(counts);
    const recipientsCountTotal = counts.reduce((acc, [, c]) => acc + c, 0);

    const targeting = await this.buildAffected({
      subGroupIds,
      fromBySubGroupId,
      countBySubGroupId,
    });

    const now = new Date();

    // 1) Crée un EmailSend MANUAL pour audit
    const emailSend = await this.prisma.emailSend.create({
      data: {
        // ✅ clé : toujours un unique "id campagne", même pour MANUAL
        brevoCampaignId: this.makeManualCampaignId(dto.templateId),

        templateId: dto.templateId,
        name: `Envoi manuel - Template ${dto.templateId}`,
        subject,
        status: "manual",
        source: "MANUAL",
        note: "Email envoyé via un autre outil (marquage manuel).",

        affected: targeting.affected,
        affectedGroupIds: targeting.affectedGroupIds,
        affectedSubGroupIds: targeting.affectedSubGroupIds,
        recipientsCount: recipientsCountTotal,

        listIds: [],
        tempListId: null,
        scheduledAt: null,
      },
    });

    // 2) Update cursors (blocage "new-only")
    const { updatedCount } = await this.upsertTemplateSubGroupCursors({
      templateId: dto.templateId,
      subGroupIds,
      lastSentAt: now,
    });

    return {
      ok: true,
      emailSendId: emailSend.id,
      templateId: dto.templateId,
      subject,
      lastSentAt: now,
      updatedCount,
      recipientsCount: recipientsCountTotal,
      subGroupIds,
      notFoundSubGroupIds,
    };
  }

  async sendMarketingCampaign(dto: ScheduleSendCampaignDto) {
    if (dto.scheduledAt) {
      throw new BadRequestException("Scheduled is not supported yet.");
    }

    const targetSubGroupIds = await this.resolveTargetSubGroupIds(dto);
    if (!targetSubGroupIds.length) {
      throw new NotFoundException("Empty selection (no subGroups resolved).");
    }

    const tpl = await this.brevoMarketing.getTemplate(dto.templateId);
    const subject = tpl.subject ?? "(no subject)";

    const { fromBySubGroupId, lastSentAtBySubGroupId } =
      await this.getFromBySubGroupId({
        templateId: dto.templateId,
        subGroupIds: targetSubGroupIds,
      });

    const or: Prisma.ContactWhereInput[] = targetSubGroupIds.map((sgId) => {
      const last = lastSentAtBySubGroupId.get(sgId);
      return {
        subGroupId: sgId,
        ...(last ? { createdAt: { gt: last } } : {}),
      };
    });

    const eligibleContacts = await this.prisma.contact.findMany({
      where: { OR: or },
      select: {
        id: true,
        email: true,
        subGroupId: true,
        groupId: true,
        createdAt: true,
      },
    });

    if (!eligibleContacts.length) {
      throw new BadRequestException(
        "No new recipients for this template and selection.",
      );
    }

    const countBySubGroupId = new Map<string, number>();
    for (const c of eligibleContacts) {
      countBySubGroupId.set(
        c.subGroupId,
        (countBySubGroupId.get(c.subGroupId) ?? 0) + 1,
      );
    }

    const now = new Date();
    const tmpLabel = `TMP:T${dto.templateId}:${now.toISOString()}`;

    const { listId: tempListId, tempListDbId } =
      await this.brevoMarketing.acquireTemporaryList({ label: tmpLabel });

    await this.brevoMarketing.bulkUpsertContactsToList(
      tempListId,
      eligibleContacts.map((c) => ({ email: c.email, attributes: {} })),
    );

    const attachmentUrl =
      dto.attachmentUrl && dto.attachmentUrl.trim().length > 0
        ? dto.attachmentUrl.trim()
        : undefined;

    const { campaignId } =
      await this.brevoMarketing.createAndSendCampaignFromTemplateToLists({
        templateId: dto.templateId,
        name: dto.name ?? `Campaign from template ${dto.templateId}`,
        subject,
        listIds: [tempListId],
        attachmentUrl,
      });

    await this.brevoMarketing.markTempListUsed({
      tempListDbId,
      brevoCampaignId: String(campaignId),
    });

    const targeting = await this.buildAffected({
      subGroupIds: targetSubGroupIds,
      fromBySubGroupId,
      countBySubGroupId,
    });

    await this.prisma.emailSend.create({
      data: {
        brevoCampaignId: String(campaignId),
        templateId: dto.templateId,
        name: dto.name ?? null,
        subject,
        status: "queued",
        source: "BREVO",

        affected: targeting.affected,
        affectedGroupIds: targeting.affectedGroupIds,
        affectedSubGroupIds: targeting.affectedSubGroupIds,
        recipientsCount: eligibleContacts.length,

        listIds: [],
        tempListId,
        scheduledAt: null,
      },
    });

    await this.upsertTemplateSubGroupCursors({
      templateId: dto.templateId,
      subGroupIds: targetSubGroupIds,
      lastSentAt: now,
    });

    return {
      campaignId,
      tempListId,
      scheduledAt: null,
      recipientsLogged: eligibleContacts.length,
    };
  }

  async getContactHistory(contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true, subGroupId: true, createdAt: true },
    });

    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);

    const candidates = await this.prisma.emailSend.findMany({
      where: {
        affectedSubGroupIds: { has: contact.subGroupId },
        createdAt: { gte: contact.createdAt },
      },
      orderBy: { createdAt: "desc" },
    });

    return candidates.filter((es) => {
      let from: Date | null = null;

      for (const g of es.affected ?? []) {
        for (const sg of g.subGroups ?? []) {
          if (sg.subGroupId === contact.subGroupId) {
            from = sg.from ?? null;
            break;
          }
        }
        if (from !== null) break;
      }

      if (!from) return true;
      return contact.createdAt > from;
    });
  }

  async listEmailSends(args?: { limit?: number; offset?: number }) {
    const limit = args?.limit && args.limit > 0 ? args.limit : 50;
    const offset = args?.offset && args.offset >= 0 ? args.offset : 0;

    const [items, total] = await Promise.all([
      this.prisma.emailSend.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      this.prisma.emailSend.count(),
    ]);

    return { items, total, limit, offset };
  }

  async getEmailInfo(id: string) {
    const emailSend = await this.prisma.emailSend.findUnique({ where: { id } });
    if (!emailSend) throw new NotFoundException(`EmailSend ${id} not found`);
    return emailSend;
  }

  async handleBrevoWebhook(token: string | undefined, payload: unknown) {
    const expected = this.config.getOrThrow<string>("BREVO_WEBHOOK_TOKEN");
    if (!token || token !== expected)
      throw new UnauthorizedException("Invalid webhook token");

    const events: BrevoWebhookEvent[] = Array.isArray(payload)
      ? (payload as BrevoWebhookEvent[])
      : [payload as BrevoWebhookEvent];

    const results: Array<
      | { ok: true; email: string; campaignId: number; eventType: string }
      | { ok: false; reason: string; evt: BrevoWebhookEvent }
    > = [];

    for (const evt of events) {
      const email = evt.email ?? "(unknown)";
      const eventType = (evt.event ?? evt.type ?? "").toString().toLowerCase();
      const campaignId = toInt(evt.campaignId ?? evt.emailCampaignId);
      const eventAt =
        toDate(evt.date) ??
        toDate(evt.eventDate) ??
        toDate(evt.timestamp) ??
        new Date();

      if (!campaignId || !eventType) {
        results.push({ ok: false, reason: "missing fields", evt });
        continue;
      }

      const brevoCampaignId = String(campaignId);

      const dataToUpdate: Record<string, unknown> = { status: eventType };
      if (eventType === "sent") dataToUpdate.sentAt = eventAt;
      if (eventType === "delivered") dataToUpdate.deliveredAt = eventAt;
      if (eventType === "opened") dataToUpdate.openedAt = eventAt;
      if (eventType === "clicked") dataToUpdate.clickedAt = eventAt;
      if (eventType.includes("bounce")) dataToUpdate.bouncedAt = eventAt;
      if (eventType.includes("unsub")) dataToUpdate.unsubscribedAt = eventAt;

      await this.prisma.emailSend.upsert({
        where: { brevoCampaignId },
        create: {
          brevoCampaignId,
          templateId: 0,
          subject: "(unknown)",
          status: eventType,
          source: "BREVO",
          affected: [],
          affectedGroupIds: [],
          affectedSubGroupIds: [],
          listIds: [],
          tempListId: null,
          ...dataToUpdate,
        },
        update: { ...dataToUpdate },
      });

      results.push({ ok: true, email, campaignId, eventType });
    }

    return { ok: true, results };
  }
}
