import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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

@Injectable()
export class BrevoMarketingService {
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly chunkSize: number;

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
  }

  /**
   * Senders (From): exposés pour UsersService / RoleService
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

  async resolveBrevoListIds(input: {
    groupIds?: string[];
    subGroupIds?: string[];
  }): Promise<number[]> {
    const listIds = new Set<number>();

    const groupIds = input.groupIds ?? [];
    const subGroupIds = input.subGroupIds ?? [];

    if (groupIds.length) {
      const subGroups = await this.prisma.subGroup.findMany({
        where: { groupId: { in: groupIds } },
        select: { id: true },
      });

      for (const sg of subGroups) {
        listIds.add(await this.ensureBrevoListForSubGroup(sg.id));
      }
    }

    for (const sgId of subGroupIds) {
      listIds.add(await this.ensureBrevoListForSubGroup(sgId));
    }

    return [...listIds];
  }

  /**
   * Crée une liste temporaire (utilisée pour envoyer uniquement aux nouveaux contacts)
   */
  async createTemporaryList(label: string): Promise<number> {
    const created = await this.brevo.createList(label);
    const listId = Number(created.id);
    if (!listId)
      throw new InternalServerErrorException("Brevo did not return list id");
    return listId;
  }

  /**
   * Crée une campagne depuis un template, ciblée sur DES listIds donnés, puis envoi immédiat
   * Permet de surcharger sender/replyTo (ex: sender = user courant).
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

    const created = await this.brevo.createCampaignFromTemplate({
      name: args.name,
      sender: args.senderOverride ?? {
        name: this.senderName,
        email: this.senderEmail,
      },
      listIds: args.listIds,
      templateId: args.templateId,
      subject: args.subject,
      ...(args.replyToOverride ? { replyTo: args.replyToOverride } : {}),
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

  async deleteBrevoContactByEmail(email: string) {
    await this.brevo.deleteContactByEmail(email);
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

  async resyncSubGroup(subGroupId: string) {
    const listId = await this.ensureBrevoListForSubGroup(subGroupId);

    const contacts = await this.prisma.contact.findMany({
      where: { subGroupId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        function: true,
        status: true,
        phoneNumber: true,
      },
    });

    const payload = contacts.map((c) => ({
      email: c.email,
      attributes: {
        FIRSTNAME: c.firstName,
        LASTNAME: c.lastName,
        FUNCTION: c.function,
        STATUS: c.status,
        PHONE: (c.phoneNumber ?? []).join(" / "),
      },
    }));

    return this.bulkUpsertContactsToList(listId, payload);
  }

  async resyncAllSubGroups() {
    const subGroups = await this.prisma.subGroup.findMany({
      select: { id: true },
    });

    type ResyncSubGroupResult = Awaited<
      ReturnType<BrevoMarketingService["resyncSubGroup"]>
    >;

    const results: ResyncSubGroupResult[] = [];

    for (const sg of subGroups) {
      results.push(await this.resyncSubGroup(sg.id));
    }

    return { subGroups: subGroups.length, results };
  }

  /**
   * Ancienne route (Brevo direct) conservée si tu l'utilises ailleurs.
   * (Tu peux la garder, mais notre flow "new-only" ne l'utilise plus.)
   */
  async sendCampaignFromTemplate(dto: ScheduleSendCampaignDto): Promise<{
    campaignId: number;
    listIds: number[];
    scheduledAt: null;
    subject: string;
    recipients: Array<{ contactId: string; email: string }>;
  }> {
    if (dto.scheduledAt) {
      throw new BadRequestException("Scheduled is not supported yet.");
    }

    const listIds = await this.resolveBrevoListIds({
      groupIds: dto.groupIds,
      subGroupIds: dto.subGroupIds,
    });

    if (!listIds.length) {
      throw new NotFoundException(
        "No target lists resolved (empty selection).",
      );
    }

    const contacts = await this.resolveContactsForSelection({
      groupIds: dto.groupIds,
      subGroupIds: dto.subGroupIds,
    });

    const tpl = await this.brevo.getEmailTemplate(dto.templateId);

    const created = await this.brevo.createCampaignFromTemplate({
      name: dto.name ?? `Campaign from template ${dto.templateId}`,
      sender: { name: this.senderName, email: this.senderEmail },
      listIds,
      templateId: dto.templateId,
      subject: tpl.subject,
      ...(dto.attachmentUrl ? { attachmentUrl: dto.attachmentUrl } : {}),
    });

    const campaignId = Number(created.id);
    if (!campaignId) {
      throw new InternalServerErrorException(
        "Brevo did not return campaign id",
      );
    }

    await this.brevo.sendCampaignNow(campaignId);

    return {
      campaignId,
      listIds,
      scheduledAt: null,
      subject: tpl.subject,
      recipients: contacts.map((c) => ({ contactId: c.id, email: c.email })),
    };
  }

  private async resolveContactsForSelection(input: {
    groupIds?: string[];
    subGroupIds?: string[];
  }) {
    const groupIds = input.groupIds ?? [];
    const subGroupIds = new Set<string>(input.subGroupIds ?? []);

    if (groupIds.length) {
      const sgs = await this.prisma.subGroup.findMany({
        where: { groupId: { in: groupIds } },
        select: { id: true },
      });
      for (const sg of sgs) subGroupIds.add(sg.id);
    }

    const ids = [...subGroupIds];
    if (!ids.length) return [];

    return this.prisma.contact.findMany({
      where: { subGroupId: { in: ids } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
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
