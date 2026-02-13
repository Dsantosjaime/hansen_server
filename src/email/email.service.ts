import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getContactHistory(contactId: string) {
    return this.prisma.emailSend.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Enregistre les destinataires d’une campagne provider (ex: Brevo) en DB.
   * Utilisé par le controller après l'appel au service provider.
   */
  async recordBrevoCampaignRecipients(args: {
    brevoCampaignId: number;
    subject: string;
    recipients: Array<{ contactId: string; email: string }>;
    status?: string; // default "queued"
  }) {
    const status = args.status ?? "queued";

    // dédup par email
    const map = new Map<string, { contactId: string; email: string }>();
    for (const r of args.recipients) map.set(r.email, r);

    const data = [...map.values()].map((r) => ({
      contactId: r.contactId,
      email: r.email,
      brevoCampaignId: String(args.brevoCampaignId),
      subject: args.subject,
      status,
    }));

    return this.prisma.emailSend.createMany({ data });
  }

  /**
   * Webhook Brevo: met à jour le statut.
   * Upsert via (brevoCampaignId, email).
   */
  async handleBrevoWebhook(token: string | undefined, payload: unknown) {
    const expected = this.config.getOrThrow<string>("BREVO_WEBHOOK_TOKEN");
    if (!token || token !== expected)
      throw new UnauthorizedException("Invalid webhook token");

    const events: BrevoWebhookEvent[] = Array.isArray(payload)
      ? (payload as BrevoWebhookEvent[])
      : [payload as BrevoWebhookEvent];

    type WebhookHandleResult =
      | { ok: true; email: string; campaignId: number; eventType: string }
      | { ok: false; reason: string; evt: BrevoWebhookEvent };

    const results: WebhookHandleResult[] = [];

    for (const evt of events) {
      const email = evt.email;
      const eventType = (evt.event ?? evt.type ?? "").toString().toLowerCase();
      const campaignId = toInt(evt.campaignId ?? evt.emailCampaignId);
      const eventAt =
        toDate(evt.date) ??
        toDate(evt.eventDate) ??
        toDate(evt.timestamp) ??
        new Date();

      if (!email || !campaignId || !eventType) {
        results.push({ ok: false, reason: "missing fields", evt });
        continue;
      }

      const dataToUpdate: Record<string, unknown> = { status: eventType };

      if (eventType === "sent") dataToUpdate.sentAt = eventAt;
      if (eventType === "delivered") dataToUpdate.deliveredAt = eventAt;
      if (eventType === "opened") dataToUpdate.openedAt = eventAt;
      if (eventType === "clicked") dataToUpdate.clickedAt = eventAt;
      if (eventType.includes("bounce")) dataToUpdate.bouncedAt = eventAt;
      if (eventType.includes("unsub")) dataToUpdate.unsubscribedAt = eventAt;

      const contact = await this.prisma.contact
        .findUnique({ where: { email } })
        .catch(() => null);

      const contactId = contact?.id;

      await this.prisma.emailSend.upsert({
        where: {
          brevoCampaignId_email: { brevoCampaignId: String(campaignId), email },
        },
        create: {
          email,
          contactId: contactId ?? null,
          brevoCampaignId: String(campaignId),
          subject: "(unknown)",
          status: eventType,
          ...dataToUpdate,
        },
        update: {
          ...(contactId ? { contactId } : {}),
          ...dataToUpdate,
        },
      });

      results.push({ ok: true, email, campaignId, eventType });
    }

    return { ok: true, results };
  }
}
