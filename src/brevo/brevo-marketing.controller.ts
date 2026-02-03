import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";
import { BrevoMarketingService } from "./brevo-marketing.service";
import { ScheduleSendCampaignDto } from "./dto/schedule-send-campaign.dto";
import { BulkSyncContactsDto } from "./dto/bulk-sync-contacts.dto";

@ApiTags("brevo-marketing")
@ApiBearerAuth("jwt")
@Controller("brevo/marketing")
@UseGuards(JwtAuthGuard, CaslGuard)
export class BrevoMarketingController {
  constructor(private readonly brevo: BrevoMarketingService) {}

  @Get("templates")
  @ApiOperation({
    summary:
      "Lister les templates Brevo (id + name + subject) pour créer des campagnes",
  })
  @CheckAbilities({ action: "read", subject: "Brevo" })
  listTemplates() {
    return this.brevo.listTemplateCampaigns();
  }

  @Post("send")
  @ApiOperation({
    summary: "Créer une campagne depuis un templateId + envoyer maintenant",
  })
  @CheckAbilities({ action: "create", subject: "Brevo" })
  sendCampaign(@Body() dto: ScheduleSendCampaignDto) {
    return this.brevo.sendCampaignFromTemplate(dto);
  }

  @Post("sub-groups/:id/ensure-list")
  @ApiOperation({ summary: "Crée la liste Brevo du sous-groupe si absente" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Brevo" })
  ensureList(@Param("id") subGroupId: string) {
    return this.brevo.ensureBrevoListForSubGroup(subGroupId);
  }

  @Post("sub-groups/:id/resync")
  @ApiOperation({ summary: "Resync complet d’un sous-groupe (utilitaire)" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Brevo" })
  resyncSubGroup(@Param("id") subGroupId: string) {
    return this.brevo.resyncSubGroup(subGroupId);
  }

  @Post("resync")
  @ApiOperation({
    summary: "Resync complet de tous les sous-groupes (utilitaire)",
  })
  @CheckAbilities({ action: "update", subject: "Brevo" })
  resyncAll() {
    return this.brevo.resyncAllSubGroups();
  }

  @Post("sub-groups/:id/contacts/bulk-sync")
  @ApiOperation({
    summary:
      "Ajout massif (upsert) de contacts dans la liste Brevo du sous-groupe",
  })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Brevo" })
  async bulkSyncToSubGroupList(
    @Param("id") subGroupId: string,
    @Body() dto: BulkSyncContactsDto,
  ) {
    const listId = await this.brevo.ensureBrevoListForSubGroup(subGroupId);
    const payload = dto.emails.map((email) => ({ email, attributes: {} }));
    return this.brevo.bulkUpsertContactsToList(listId, payload);
  }
}
