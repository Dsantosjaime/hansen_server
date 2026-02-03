import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";

type BrevoWebhookEvent = {
  // payloads Brevo peuvent varier: on fait un mapping best-effort
  email?: string;
  event?: string; // delivered/opened/clicked/bounced/unsubscribed...
  date?: string | number; // ISO ou timestamp
  campaignId?: number | string;

  // variantes possibles
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
    const d = new Date(v * 1000); // souvent seconds
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

  async recordBrevoCampaignRecipients(args: {
    brevoCampaignId: number;
    subject: string;
    recipients: Array<{ contactId: string; email: string }>;
    status?: string; // default "queued"
  }) {
    const status = args.status ?? "queued";

    // dédup par email (propre ici, pas dans BrevoMarketingService)
    const map = new Map<string, { contactId: string; email: string }>();
    for (const r of args.recipients) map.set(r.email, r);

    const data = [...map.values()].map((r) => ({
      contactId: r.contactId,
      email: r.email,
      brevoCampaignId: args.brevoCampaignId,
      subject: args.subject,
      status,
    }));

    // Optionnel mais recommandé si disponible: évite crash si relance
    // (Prisma Mongo supporte createMany; skipDuplicates dépend des versions)
    return this.prisma.emailSend.createMany({
      data,
    });
  }

  /**
   * Webhook Brevo: met à jour le statut.
   * Upsert via (brevoCampaignId, email) pour éviter faux positifs.
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

      // Map event -> status + timestamp fields
      const dataToUpdate: Record<string, unknown> = { status: eventType };

      if (eventType === "sent") dataToUpdate.sentAt = eventAt;
      if (eventType === "delivered") dataToUpdate.deliveredAt = eventAt;
      if (eventType === "opened") dataToUpdate.openedAt = eventAt;
      if (eventType === "clicked") dataToUpdate.clickedAt = eventAt;
      if (eventType.includes("bounce")) dataToUpdate.bouncedAt = eventAt;
      if (eventType.includes("unsub")) dataToUpdate.unsubscribedAt = eventAt;

      // si on ne connaissait pas contactId, on peut le remplir depuis l’email unique
      const contact = await this.prisma.contact
        .findUnique({ where: { email } })
        .catch(() => null);

      const contactId = contact?.id;

      await this.prisma.emailSend.upsert({
        where: {
          brevoCampaignId_email: { brevoCampaignId: campaignId, email },
        },
        create: {
          email,
          contactId: contactId ?? null,
          brevoCampaignId: campaignId,
          subject: "(unknown)", // sera rempli lors du send, sinon inconnu
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
