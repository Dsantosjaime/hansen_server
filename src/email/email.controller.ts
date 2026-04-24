import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
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
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

  private stringifyForLog(value: unknown) {
    try {
      const s = JSON.stringify(value);
      if (!s) return String(value);
      return s.length > 4000 ? `${s.slice(0, 4000)}... [truncated]` : s;
    } catch {
      return "[unserializable]";
    }
  }

  private maskToken(token?: string) {
    if (!token) return "(missing)";
    if (token.length <= 8) return "***";
    return `${token.slice(0, 4)}***${token.slice(-2)}`;
  }

  private extractBearerToken(authorization?: string): string | undefined {
    if (!authorization) return undefined;

    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || undefined;
  }

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
  @HttpCode(200)
  @ApiOperation({
    summary: "Webhook Brevo pour mise à jour du statut email des contacts",
  })
  @ApiQuery({
    name: "token",
    required: false,
    description: "Fallback legacy si le token est passé en query param",
  })
  async brevoWebhook(
    @Query("token") queryToken: string | undefined,
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const bearerToken = this.extractBearerToken(authorization);
    const effectiveToken = bearerToken ?? queryToken;

    const result = await this.emailService.handleBrevoWebhook(
      effectiveToken,
      body,
    );

    this.logger.log(
      `[BREVO WEBHOOK] success result=${this.stringifyForLog(result)}`,
    );

    return result;
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
