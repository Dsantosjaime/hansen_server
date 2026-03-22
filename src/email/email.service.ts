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

  async sendMarketingCampaign(dto: ScheduleSendCampaignDto) {
    if (dto.scheduledAt) {
      throw new BadRequestException("Scheduled is not supported yet.");
    }

    // 1) subGroupIds ciblés
    const targetSubGroupIds = await this.resolveTargetSubGroupIds(dto);
    if (!targetSubGroupIds.length) {
      throw new NotFoundException("Empty selection (no subGroups resolved).");
    }

    // 2) Template (subject)
    const tpl = await this.brevoMarketing.getTemplate(dto.templateId);
    const subject = tpl.subject ?? "(no subject)";

    // 3) Cursors existants
    const cursors = await this.prisma.templateSubGroupCursor.findMany({
      where: {
        templateId: dto.templateId,
        subGroupId: { in: targetSubGroupIds },
      },
      select: { subGroupId: true, lastSentAt: true },
    });

    const lastSentAtBySubGroupId = new Map<string, Date>();
    for (const c of cursors)
      lastSentAtBySubGroupId.set(c.subGroupId, c.lastSentAt);

    const fromBySubGroupId = new Map<string, Date | null>();
    for (const sgId of targetSubGroupIds) {
      fromBySubGroupId.set(sgId, lastSentAtBySubGroupId.get(sgId) ?? null);
    }

    // 4) Eligible "new-only"
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

    // 5) Comptage par subgroup
    const countBySubGroupId = new Map<string, number>();
    for (const c of eligibleContacts) {
      countBySubGroupId.set(
        c.subGroupId,
        (countBySubGroupId.get(c.subGroupId) ?? 0) + 1,
      );
    }

    // 6) Acquire temp list (pool <= 30)
    const now = new Date();
    const tmpLabel = `TMP:T${dto.templateId}:${now.toISOString()}`;

    const { listId: tempListId, tempListDbId } =
      await this.brevoMarketing.acquireTemporaryList({ label: tmpLabel });

    // 7) Upsert des contacts éligibles dans la liste temp
    await this.brevoMarketing.bulkUpsertContactsToList(
      tempListId,
      eligibleContacts.map((c) => ({ email: c.email, attributes: {} })),
    );

    // 8) Envoi campagne vers la liste temp
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

    // 9) Enregistre EmailSend (run)
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
        affected: targeting.affected,
        affectedGroupIds: targeting.affectedGroupIds,
        affectedSubGroupIds: targeting.affectedSubGroupIds,
        recipientsCount: eligibleContacts.length,

        // plus de lists logiques par subgroup
        listIds: [],
        tempListId,

        scheduledAt: null,
      },
    });

    // 10) Update cursors (lastSentAt = now)
    for (const sgId of targetSubGroupIds) {
      await this.prisma.templateSubGroupCursor.upsert({
        where: {
          templateId_subGroupId: {
            templateId: dto.templateId,
            subGroupId: sgId,
          },
        },
        create: {
          templateId: dto.templateId,
          subGroupId: sgId,
          lastSentAt: now,
        },
        update: { lastSentAt: now },
      });
    }

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
