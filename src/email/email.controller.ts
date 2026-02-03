import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
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

@ApiTags("emails")
@Controller("emails")
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get("contacts/:contactId/history")
  @ApiBearerAuth("jwt")
  @UseGuards(JwtAuthGuard, CaslGuard)
  @ApiOperation({ summary: "Historique des emails d’un contact" })
  @ApiParam({ name: "contactId", type: String })
  @CheckAbilities({ action: "read", subject: "Email" })
  getHistory(@Param("contactId") contactId: string) {
    return this.emailService.getContactHistory(contactId);
  }

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
}
