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
import { MarkTemplateAsSentDto } from "./dto/mark-template-as-sent.dto";

@ApiTags("emails")
@Controller("emails")
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

  @Get("contacts/:contactId")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary:
      "Historique des campagnes d’emails d’un contact (calculé via cursor/from)",
  })
  @ApiParam({ name: "contactId", type: String })
  @CheckAbilities({ action: "read", subject: "Email" })
  getHistory(@Param("contactId") contactId: string) {
    return this.emailService.getContactHistory(contactId);
  }

  @Post("brevo/webhook")
  @ApiOperation({ summary: "Webhook Brevo pour mise à jour des statuts" })
  @ApiQuery({ name: "token", required: true })
  brevoWebhook(@Query("token") token: string, @Body() body: unknown) {
    return this.emailService.handleBrevoWebhook(token, body);
  }

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
    summary:
      "Créer une campagne depuis un templateId + envoyer uniquement aux nouveaux contacts ciblés (temp list pool <= 30)",
  })
  @CheckAbilities({ action: "create", subject: "Email" })
  sendCampaign(@Body() dto: ScheduleSendCampaignDto) {
    return this.emailService.sendMarketingCampaign(dto);
  }

  /**
   * ✅ NEW: même blocage que sendMarketingCampaign, mais sans envoyer d'email.
   */
  @Post("marketing/campaigns/mark-sent")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({
    summary:
      "Marquer un template comme déjà envoyé pour une sélection (groupIds/subGroupIds) - met à jour les cursors + crée un EmailSend MANUAL",
  })
  @CheckAbilities({ action: "create", subject: "Email" })
  markSent(@Body() dto: MarkTemplateAsSentDto) {
    return this.emailService.markMarketingTemplateAsSent(dto);
  }

  @Get("marketing/campaigns")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({ summary: "Lister les campagnes marketing (depuis la DB)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @CheckAbilities({ action: "read", subject: "Email" })
  listCampaigns(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.emailService.listEmailSends({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get("marketing/campaigns/:id")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({ summary: "Récupérer le détail d’une campagne (DB)" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "read", subject: "Email" })
  getEmailInfo(@Param("id") id: string) {
    return this.emailService.getEmailInfo(id);
  }
}
