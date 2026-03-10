import {
  Body,
  Controller,
  Post,
  UseGuards,
  ParseArrayPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";
import { ExtractService } from "./extract.service";
import { ExtractGroupDto } from "./dto/extract.dto";

@ApiTags("extract")
@ApiBearerAuth("jwt")
@Controller("extract")
@UseGuards(JwtAuthGuard, CaslGuard)
export class ExtractController {
  constructor(private readonly extractService: ExtractService) {}

  @Post("contacts")
  @ApiOperation({
    summary:
      "Récupérer les contacts des subGroups fournis (en une requête côté DB)",
  })
  @CheckAbilities({ action: "read", subject: "Contact" })
  @ApiBody({ type: [ExtractGroupDto] })
  extractContacts(
    @Body(new ParseArrayPipe({ items: ExtractGroupDto }))
    groups: ExtractGroupDto[],
  ) {
    return this.extractService.extractContacts(groups);
  }
}
