import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";

import { EmailService } from "./email.service";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";

import { ScheduleSendCampaignDto } from "@/brevo/dto/schedule-send-campaign.dto";
import { BulkSyncContactsDto } from "@/brevo/dto/bulk-sync-contacts.dto";

@ApiTags("emails")
@Controller("emails")
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

  // ======================
  // Historique emails
  // ======================
  @Get("contacts/:contactId")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({ summary: "Historique des emails d’un contact" })
  @ApiParam({ name: "contactId", type: String })
  @CheckAbilities({ action: "read", subject: "Email" })
  getHistory(@Param("contactId") contactId: string) {
    return this.emailService.getContactHistory(contactId);
  }

  // ======================
  // Webhook provider (Brevo)
  // ======================
  /**
   * Webhook Brevo (pas de JWT, protégé par token en query)
   * Configure Brevo webhook URL: https://.../emails/brevo/webhook?token=...
   */
  @Post("brevo/webhook")
  @ApiOperation({ summary: "Webhook Brevo pour mise à jour des statuts" })
  @ApiQuery({ name: "token", required: true })
  brevoWebhook(@Query("token") token: string, @Body() body: unknown) {
    return this.emailService.handleBrevoWebhook(token, body);
  }

  // ======================
  // Marketing (façade API)
  // ======================

  @Get("marketing/templates")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary:
      "Lister les templates email (id + name + subject) pour créer des campagnes",
  })
  @CheckAbilities({ action: "read", subject: "Email" })
  listTemplates() {
    return this.brevoMarketing.listTemplateCampaigns();
  }

  @Post("marketing/campaigns/send")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary: "Créer une campagne depuis un templateId + envoyer maintenant",
  })
  @CheckAbilities({ action: "create", subject: "Email" })
  async sendCampaign(@Body() dto: ScheduleSendCampaignDto) {
    // 1) Actions provider (Brevo)
    const result = await this.brevoMarketing.sendCampaignFromTemplate(dto);

    // 2) Logging emailSend centralisé dans EmailService
    await this.emailService.recordBrevoCampaignRecipients({
      brevoCampaignId: result.campaignId,
      subject: result.subject,
      recipients: result.recipients,
      status: "queued",
    });

    // 3) Réponse identique à l’ancienne route
    return {
      campaignId: result.campaignId,
      listIds: result.listIds,
      scheduledAt: result.scheduledAt,
      recipientsLogged: result.recipients.length,
    };
  }

  @Get("marketing/campaigns")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({ summary: "Lister les campagnes marketing créées" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @CheckAbilities({ action: "read", subject: "Email" })
  listCampaigns(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.brevoMarketing.listMarketingCampaigns({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post("marketing/sub-groups/:id/ensure-list")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary: "Crée la liste marketing du sous-groupe si absente",
  })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Subgroup" })
  ensureList(@Param("id") subGroupId: string) {
    return this.brevoMarketing.ensureBrevoListForSubGroup(subGroupId);
  }

  @Post("marketing/sub-groups/:id/resync")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({ summary: "Resync complet d’un sous-groupe (utilitaire)" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Subgroup" })
  resyncSubGroup(@Param("id") subGroupId: string) {
    return this.brevoMarketing.resyncSubGroup(subGroupId);
  }

  @Post("marketing/resync")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary: "Resync complet de tous les sous-groupes (utilitaire)",
  })
  @CheckAbilities({ action: "update", subject: "Subgroup" })
  resyncAll() {
    return this.brevoMarketing.resyncAllSubGroups();
  }

  @Post("marketing/sub-groups/:id/contacts/bulk-sync")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary:
      "Ajout massif (upsert) de contacts dans la liste marketing du sous-groupe",
  })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "create", subject: "Contact" })
  async bulkSyncToSubGroupList(
    @Param("id") subGroupId: string,
    @Body() dto: BulkSyncContactsDto,
  ) {
    const listId =
      await this.brevoMarketing.ensureBrevoListForSubGroup(subGroupId);

    const payload = dto.emails.map((email) => ({ email, attributes: {} }));

    return this.brevoMarketing.bulkUpsertContactsToList(listId, payload);
  }
}
