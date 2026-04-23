import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";
import { ScrapService } from "./scrap.service";
import { SubmitLinkedinScrapeDto } from "./dto/submit-linkedin-scrape.dto";
import { SubmitLinkedinScrapeResponseDto } from "./dto/submit-linkedin-scrape.response";

@ApiTags("scrap")
@ApiBearerAuth("jwt")
@Controller("recuperation")
@UseGuards(JwtAuthGuard, CaslGuard)
export class ScrapController {
  constructor(private readonly scrap: ScrapService) {}

  @Post("source")
  @ApiOperation({
    summary:
      "Reçoit le résultat d’un scraping Linkedin, déduit les emails, upsert BDD et Brevo (liste du subGroup).",
  })
  @CheckAbilities({ action: "create", subject: "Contact" })
  async submitLinkedin(
    @Body() dto: SubmitLinkedinScrapeDto,
  ): Promise<SubmitLinkedinScrapeResponseDto> {
    const received = await this.scrap.submitLinkedin(dto);
    return { ok: true, received };
  }
}
