import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

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

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type AffectedSubGroup = { subGroupId: string; subGroupName: string };
type AffectedGroup = {
  groupId: string;
  groupName: string;
  subGroups: AffectedSubGroup[];
};

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Historique d’un contact:
   * - le contact doit exister au moment de l’envoi (emailSend.createdAt >= contact.createdAt)
   * - le contact doit appartenir à un des sous-groupes ciblés (affectedSubGroupIds)
   */
  async getContactHistory(contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true, groupId: true, subGroupId: true, createdAt: true },
    });

    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);

    const where: Prisma.EmailSendWhereInput = {
      createdAt: { gte: contact.createdAt },
      affectedSubGroupIds: { has: contact.subGroupId },
    };

    return this.prisma.emailSend.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

  /**
   * Construit affected[] à partir des listIds (ciblage réel).
   * Ici: SubGroup.brevoListId est Int? (confirmé).
   */
  private async buildAffectedFromListIds(listIds: number[]) {
    if (!listIds.length) {
      return { affected: [], affectedGroupIds: [], affectedSubGroupIds: [] };
    }

    const subGroups = await this.prisma.subGroup.findMany({
      where: {
        brevoListId: { in: listIds },
      },
      select: {
        id: true,
        name: true,
        groupId: true,
      },
    });

    const groupIds = [...new Set(subGroups.map((sg) => sg.groupId))];

    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, name: true },
    });

    const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

    const affectedMap = new Map<string, AffectedGroup>();

    for (const sg of subGroups) {
      const groupId = sg.groupId;
      const groupName = groupNameById.get(groupId) ?? "(unknown group)";

      let entry = affectedMap.get(groupId);
      if (!entry) {
        entry = { groupId, groupName, subGroups: [] };
        affectedMap.set(groupId, entry);
      }

      if (!entry.subGroups.some((x) => x.subGroupId === sg.id)) {
        entry.subGroups.push({ subGroupId: sg.id, subGroupName: sg.name });
      }
    }

    const affected = [...affectedMap.values()]
      .map((g) => ({
        ...g,
        subGroups: [...g.subGroups].sort((a, b) =>
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
   * Fallback: reconstruit affected à partir des contacts présents dans recipients.
   * (utile si listIds manquent, mais moins fidèle pour le "ciblage")
   */
  private async buildAffectedFromRecipients(
    recipients: Array<{ contactId: string }>,
  ) {
    const contactIds = recipients.map((r) => r.contactId).filter(Boolean);
    if (!contactIds.length) {
      return { affected: [], affectedGroupIds: [], affectedSubGroupIds: [] };
    }

    const contacts = (
      await Promise.all(
        chunk(contactIds, 500).map((ids) =>
          this.prisma.contact.findMany({
            where: { id: { in: ids } },
            select: { groupId: true, subGroupId: true },
          }),
        ),
      )
    ).flat();

    const groupIds = [...new Set(contacts.map((c) => c.groupId))];
    const subGroupIds = [...new Set(contacts.map((c) => c.subGroupId))];

    const [groups, subGroups] = await Promise.all([
      this.prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true },
      }),
      this.prisma.subGroup.findMany({
        where: { id: { in: subGroupIds } },
        select: { id: true, name: true, groupId: true },
      }),
    ]);

    const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

    const affectedMap = new Map<string, AffectedGroup>();

    for (const sg of subGroups) {
      const groupId = sg.groupId;
      const groupName = groupNameById.get(groupId) ?? "(unknown group)";

      let entry = affectedMap.get(groupId);
      if (!entry) {
        entry = { groupId, groupName, subGroups: [] };
        affectedMap.set(groupId, entry);
      }

      if (!entry.subGroups.some((x) => x.subGroupId === sg.id)) {
        entry.subGroups.push({ subGroupId: sg.id, subGroupName: sg.name });
      }
    }

    const affected = [...affectedMap.values()]
      .map((g) => ({
        ...g,
        subGroups: [...g.subGroups].sort((a, b) =>
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
   * Enregistre / upsert 1 doc EmailSend par campagne.
   * Priorité: listIds (ciblage). Fallback: recipients.
   */
  async recordBrevoCampaignSend(args: {
    brevoCampaignId: number;
    subject: string;
    recipients: Array<{ contactId: string; email: string }>;
    status?: string; // default "queued"
    listIds?: number[];
    scheduledAt?: Date;
  }) {
    const status = args.status ?? "queued";
    const brevoCampaignId = String(args.brevoCampaignId);

    const listIds = (args.listIds ?? []).filter((n) => Number.isFinite(n));

    const fromLists = await this.buildAffectedFromListIds(listIds);
    const targeting =
      fromLists.affectedSubGroupIds.length > 0
        ? fromLists
        : await this.buildAffectedFromRecipients(args.recipients);

    return this.prisma.emailSend.upsert({
      where: { brevoCampaignId },
      create: {
        brevoCampaignId,
        subject: args.subject,
        status,
        affected: targeting.affected,
        affectedGroupIds: targeting.affectedGroupIds,
        affectedSubGroupIds: targeting.affectedSubGroupIds,
        recipientsCount: args.recipients.length,
        listIds,
        ...(args.scheduledAt ? { scheduledAt: args.scheduledAt } : {}),
      },
      update: {
        subject: args.subject,
        status,
        affected: targeting.affected,
        affectedGroupIds: targeting.affectedGroupIds,
        affectedSubGroupIds: targeting.affectedSubGroupIds,
        recipientsCount: args.recipients.length,
        listIds,
        ...(args.scheduledAt ? { scheduledAt: args.scheduledAt } : {}),
      },
    });
  }

  /**
   * Webhook Brevo: met à jour le statut global de la campagne (pas par destinataire).
   * Upsert via brevoCampaignId.
   */
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
