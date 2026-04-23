import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import { ScheduleSendCampaignDto } from "./dto/schedule-send-campaign.dto";
import { BREVO_CLIENT } from "./brevo.constants";
import type { BrevoClient } from "./brevo.client";
import { EmailTemplateDto } from "src/email/dto/email-template.dto";
import { EmailCampaignDto } from "src/email/dto/email-campaign.dto";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function addHours(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 3600 * 1000);
}

@Injectable()
export class BrevoMarketingService {
  private readonly logger = new Logger(BrevoMarketingService.name);

  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly chunkSize: number;

  private readonly tempPoolSize: number;
  private readonly tempReservationHours: number;

  constructor(
    @Inject(BREVO_CLIENT) private readonly brevo: BrevoClient,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.senderEmail = this.config.getOrThrow<string>(
      "BREVO_MARKETING_SENDER_EMAIL",
    );
    this.senderName = this.config.getOrThrow<string>(
      "BREVO_MARKETING_SENDER_NAME",
    );
    this.chunkSize = Number(
      this.config.get<string>("BREVO_SYNC_CHUNK_SIZE") ?? 100,
    );

    // Pool de 30 (par défaut) + réservation (par défaut 48h)
    this.tempPoolSize = Number(
      this.config.get<string>("BREVO_TEMP_LIST_POOL_SIZE") ?? 30,
    );
    this.tempReservationHours = Number(
      this.config.get<string>("BREVO_TEMP_LIST_RESERVATION_HOURS") ?? 48,
    );
  }

  /**
   * Senders (From)
   */
  async createSender(args: { name: string; email: string }): Promise<number> {
    const created = await this.brevo.createSender(args);
    const id = Number(created.id);
    if (!id)
      throw new InternalServerErrorException("Brevo did not return sender id");
    return id;
  }

  async deleteSender(senderId: number): Promise<void> {
    await this.brevo.deleteSender(senderId);
  }

  async listTemplateCampaigns(): Promise<EmailTemplateDto[]> {
    const templates = await this.brevo.listEmailTemplates({
      limit: 100,
      offset: 0,
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      isActive: t.isActive,
    }));
  }

  async getTemplate(templateId: number) {
    return this.brevo.getEmailTemplate(templateId);
  }

  /**
   * LEGACY (à ne plus appeler dans le nouveau flow) : list par subgroup
   */
  async ensureBrevoListForSubGroup(subGroupId: string): Promise<number> {
    const subGroup = await this.prisma.subGroup.findUnique({
      where: { id: subGroupId },
    });

    if (!subGroup) {
      throw new NotFoundException(`SubGroup ${subGroupId} not found`);
    }

    if (subGroup.brevoListId) return subGroup.brevoListId;

    const created = await this.brevo.createList(
      `SG:${subGroup.name} (${subGroup.id})`,
    );

    const listId = Number(created.id);
    if (!listId) {
      throw new InternalServerErrorException("Brevo did not return list id");
    }

    await this.prisma.subGroup.update({
      where: { id: subGroupId },
      data: { brevoListId: listId },
    });

    return listId;
  }

  /**
   * Crée une liste temporaire brute (sans pool)
   */
  async createTemporaryList(label: string): Promise<number> {
    const created = await this.brevo.createList(label);
    const listId = Number(created.id);
    if (!listId)
      throw new InternalServerErrorException("Brevo did not return list id");
    return listId;
  }

  /**
   * Pool: acquire une liste temporaire (crée ou recycle) avec limite à 30.
   */
  async acquireTemporaryList(args: {
    label: string;
  }): Promise<{ listId: number; tempListDbId: string }> {
    const now = new Date();

    const count = await this.prisma.brevoTempList.count();

    // 1) Si on est sous la limite : create direct
    if (count < this.tempPoolSize) {
      const listId = await this.createTemporaryList(args.label);

      const row = await this.prisma.brevoTempList.create({
        data: {
          brevoListId: listId,
          label: args.label,
          createdAt: now,
          lastUsedAt: now,
          reservedUntil: addHours(now, this.tempReservationHours),
          lastBrevoCampaignId: null,
        },
        select: { id: true },
      });

      return { listId, tempListDbId: row.id };
    }

    // 2) Recycle la plus ancienne "recyclable"
    const candidate = await this.prisma.brevoTempList.findFirst({
      where: { reservedUntil: { lt: now } },
      orderBy: { createdAt: "asc" },
      select: { id: true, brevoListId: true },
    });

    if (!candidate) {
      throw new BadRequestException(
        `Temporary list pool exhausted (${this.tempPoolSize}). Retry later.`,
      );
    }

    // Supprime côté Brevo (best effort), puis DB
    try {
      await this.brevo.deleteList(candidate.brevoListId);
    } catch (e: any) {
      this.logger.warn(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `deleteBrevoList failed for listId=${candidate.brevoListId}: ${e?.message ?? String(e)}`,
      );
    }

    await this.prisma.brevoTempList.delete({ where: { id: candidate.id } });

    // Recrée une nouvelle liste
    const newListId = await this.createTemporaryList(args.label);

    const row = await this.prisma.brevoTempList.create({
      data: {
        brevoListId: newListId,
        label: args.label,
        createdAt: now,
        lastUsedAt: now,
        reservedUntil: addHours(now, this.tempReservationHours),
        lastBrevoCampaignId: null,
      },
      select: { id: true },
    });

    return { listId: newListId, tempListDbId: row.id };
  }

  async markTempListUsed(args: {
    tempListDbId: string;
    brevoCampaignId: string;
  }) {
    const now = new Date();
    await this.prisma.brevoTempList.update({
      where: { id: args.tempListDbId },
      data: {
        lastUsedAt: now,
        reservedUntil: addHours(now, this.tempReservationHours),
        lastBrevoCampaignId: args.brevoCampaignId,
      },
    });
  }

  async upsertContact(args: {
    email: string;
    attributes?: Record<string, unknown>;
  }) {
    await this.brevo.upsertContact(args);
  }

  async deleteBrevoContactByEmail(email: string) {
    await this.brevo.deleteContactByEmail(email);
  }

  async upsertContactToList(params: {
    email: string;
    listId: number;
    attributes?: Record<string, unknown>;
  }) {
    await this.brevo.upsertContactToList(params);
  }

  async removeEmailsFromList(listId: number, emails: string[]) {
    if (!emails.length) return;
    await this.brevo.removeEmailsFromList(listId, emails);
  }

  async deleteBrevoList(listId: number): Promise<void> {
    await this.brevo.deleteList(listId);
  }

  async bulkUpsertContactsToList(
    listId: number,
    contacts: Array<{ email: string; attributes?: Record<string, unknown> }>,
  ) {
    const batches = chunkArray(contacts, this.chunkSize);

    let success = 0;
    let failed = 0;

    for (const batch of batches) {
      for (const c of batch) {
        try {
          await this.upsertContactToList({
            email: c.email,
            listId,
            attributes: c.attributes,
          });
          success++;
        } catch {
          failed++;
        }
      }
    }

    return {
      listId,
      total: contacts.length,
      success,
      failed,
      chunkSize: this.chunkSize,
    };
  }

  /**
   * Nettoyage global => supprime toutes les lists Brevo stockées sur subGroup.brevoListId
   * - dryRun=true : ne supprime rien, mais retourne ce qui serait supprimé
   */
  async cleanupAllSubGroupLists(args?: { dryRun?: boolean }): Promise<{
    dryRun: boolean;
    totalWithListId: number;
    deletedRemote: number;
    dbCleared: number;
    failedRemoteDelete: number;
    results: Array<{
      subGroupId: string;
      listId: number;
      deletedRemote: boolean;
      dbCleared: boolean;
      error?: string;
    }>;
  }> {
    const dryRun = !!args?.dryRun;

    const subGroups = await this.prisma.subGroup.findMany({
      where: { brevoListId: { not: null } },
      select: { id: true, brevoListId: true },
    });

    const results: Array<{
      subGroupId: string;
      listId: number;
      deletedRemote: boolean;
      dbCleared: boolean;
      error?: string;
    }> = [];

    let deletedRemote = 0;
    let dbCleared = 0;
    let failedRemoteDelete = 0;

    for (const sg of subGroups) {
      const listId = sg.brevoListId!;
      if (dryRun) {
        results.push({
          subGroupId: sg.id,
          listId,
          deletedRemote: false,
          dbCleared: false,
        });
        continue;
      }

      let remoteOk = false;
      try {
        await this.brevo.deleteList(listId);
        remoteOk = true;
        deletedRemote++;
      } catch (e: any) {
        failedRemoteDelete++;
        results.push({
          subGroupId: sg.id,
          listId,
          deletedRemote: false,
          dbCleared: false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          error: e?.message ?? String(e),
        });
      }

      try {
        await this.prisma.subGroup.update({
          where: { id: sg.id },
          data: { brevoListId: null },
        });
        dbCleared++;

        if (!results.find((r) => r.subGroupId === sg.id)) {
          results.push({
            subGroupId: sg.id,
            listId,
            deletedRemote: remoteOk,
            dbCleared: true,
          });
        } else {
          const r = results.find((r) => r.subGroupId === sg.id)!;
          r.dbCleared = true;
          r.deletedRemote = remoteOk;
        }
      } catch (e: any) {
        results.push({
          subGroupId: sg.id,
          listId,
          deletedRemote: remoteOk,
          dbCleared: false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          error: `DB update failed: ${e?.message ?? String(e)}`,
        });
      }
    }

    return {
      dryRun,
      totalWithListId: subGroups.length,
      deletedRemote,
      dbCleared,
      failedRemoteDelete,
      results,
    };
  }

  async cleanupSubGroupBrevoLists(args?: { dryRun?: boolean }) {
    return this.cleanupAllSubGroupLists(args);
  }

  /**
   * Campagne vers listIds (temp list)
   */
  async createAndSendCampaignFromTemplateToLists(args: {
    templateId: number;
    name: string;
    subject: string;
    listIds: number[];
    attachmentUrl?: string;

    senderOverride?: { name: string; email: string };
    replyToOverride?: string;
  }): Promise<{ campaignId: number }> {
    if (!args.listIds.length) {
      throw new NotFoundException("No target lists (empty listIds).");
    }

    const currentSender = args.senderOverride ?? {
      name: this.senderName,
      email: this.senderEmail,
    };

    const created = await this.brevo.createCampaignFromTemplate({
      name: args.name,
      sender: currentSender,
      listIds: args.listIds,
      templateId: args.templateId,
      subject: args.subject,
      replyTo: args.replyToOverride ?? currentSender.email,
      ...(args.attachmentUrl ? { attachmentUrl: args.attachmentUrl } : {}),
    });

    const campaignId = Number(created.id);
    if (!campaignId) {
      throw new InternalServerErrorException(
        "Brevo did not return campaign id",
      );
    }

    await this.brevo.sendCampaignNow(campaignId);

    return { campaignId };
  }

  /**
   * (Legacy) conserver si utilisé ailleurs
   */
  sendCampaignFromTemplate(dto: ScheduleSendCampaignDto): Promise<{
    campaignId: number;
    listIds: number[];
    scheduledAt: null;
    subject: string;
    recipients: Array<{ contactId: string; email: string }>;
  }> {
    if (dto.scheduledAt) {
      throw new BadRequestException("Scheduled is not supported yet.");
    }

    throw new BadRequestException(
      "sendCampaignFromTemplate legacy disabled: use EmailService.sendMarketingCampaign() with temp list pool.",
    );
  }

  async listMarketingCampaigns(input?: {
    limit?: number;
    offset?: number;
  }): Promise<EmailCampaignDto[]> {
    const limit = Number(input?.limit ?? 50);
    const offset = Number(input?.offset ?? 0);

    const campaigns = await this.brevo.listEmailCampaigns({
      limit,
      offset,
      sort: "desc",
      type: "classic",
    });

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      status: c.status,
      scheduledAt: c.scheduledAt ?? null,
      createdAt: c.createdAt ?? null,
      modifiedAt: c.modifiedAt ?? null,
    }));
  }
}
