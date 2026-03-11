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

  /**
   * Résout la liste finale des subGroupIds ciblés (groupIds expand)
   */
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

  /**
   * Construit la structure affected[] (group/subGroup names) + from + counts
   */
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
   * Nouveau flow : envoi uniquement aux nouveaux contacts (par templateId + subGroupId)
   * Retourne une réponse compatible avec l'existant.
   */
  async sendMarketingCampaign(dto: ScheduleSendCampaignDto) {
    try {
      if (dto.scheduledAt) {
        throw new BadRequestException("Scheduled is not supported yet.");
      }

      // 1) subGroupIds ciblés
      const targetSubGroupIds = await this.resolveTargetSubGroupIds(dto);
      if (!targetSubGroupIds.length) {
        throw new NotFoundException("Empty selection (no subGroups resolved).");
      }

      // 2) listIds “logiques” des sous-groupes (on les garde pour ne pas casser le retour)
      const logicalListIds = await this.brevoMarketing.resolveBrevoListIds({
        groupIds: dto.groupIds,
        subGroupIds: dto.subGroupIds,
      });

      // 3) Récupère le template (subject)
      const tpl = await this.brevoMarketing.getTemplate(dto.templateId);
      const subject = tpl.subject ?? "(no subject)";

      // 4) Récupère les cursors existants
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

      // from = lastSentAt (moment T-1) à stocker dans EmailSend
      const fromBySubGroupId = new Map<string, Date | null>();
      for (const sgId of targetSubGroupIds) {
        fromBySubGroupId.set(sgId, lastSentAtBySubGroupId.get(sgId) ?? null);
      }

      // 5) Requête "éligibles" en une fois (OR par sous-groupe, avec createdAt > lastSentAt)
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

      // 6) Comptage par sous-groupe
      const countBySubGroupId = new Map<string, number>();
      for (const c of eligibleContacts) {
        countBySubGroupId.set(
          c.subGroupId,
          (countBySubGroupId.get(c.subGroupId) ?? 0) + 1,
        );
      }

      // 7) Liste temporaire Brevo
      const now = new Date();
      const tmpLabel = `TMP:T${dto.templateId}:${now.toISOString()}`;
      const tempListId =
        await this.brevoMarketing.createTemporaryList(tmpLabel);

      // 8) Upsert des éligibles dans la liste temp
      await this.brevoMarketing.bulkUpsertContactsToList(
        tempListId,
        eligibleContacts.map((c) => ({ email: c.email, attributes: {} })),
      );

      // 9) Création + envoi campagne vers la liste temp
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

      // 10) Enregistre EmailSend (run)
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
          listIds: logicalListIds,
          tempListId,
          scheduledAt: null,
        },
      });

      // 11) Update cursors (lastSentAt = now) pour tous les sous-groupes ciblés
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

      // 12) Réponse compatible
      return {
        campaignId,
        listIds: logicalListIds,
        scheduledAt: null,
        recipientsLogged: eligibleContacts.length,
      };
    } catch (e: any) {
      // axios: e.response?.data contient le message Brevo
      throw new BadRequestException({
        message: "Brevo error",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        brevoStatus: e?.response?.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        brevoData: e?.response?.data,
      });
    }
  }

  /**
   * Historique contact :
   * - récupère les campaigns où le sous-groupe du contact a été ciblé
   * - filtre par "from" pour ne garder que les runs où le contact était éligible (nouveau)
   */
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

    // Filtre en mémoire via from
    return candidates.filter((es) => {
      // retrouve le "from" du sous-groupe du contact
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

      // si from null => 1er envoi => le contact (créé avant es.createdAt) est inclus
      if (!from) return true;

      // sinon le contact a reçu uniquement s'il est "nouveau" après from
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
          templateId: 0, // inconnu via webhook seul
          subject: "(unknown)",
          status: eventType,
          affected: [],
          affectedGroupIds: [],
          affectedSubGroupIds: [],
          listIds: [],
          ...dataToUpdate,
        },
        update: {
          ...dataToUpdate,
        },
      });

      results.push({ ok: true, email, campaignId, eventType });
    }

    return { ok: true, results };
  }
}
