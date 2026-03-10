import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateEmailAddressTemplateDto } from "./dto/create-email-address-template.dto";
import { UpdateEmailAddressTemplateDto } from "./dto/update-email-address-template.dto";
import { EmailAddressTemplatesService } from "./email-address-templates.service";

@ApiTags("email-address-templates")
@ApiBearerAuth("jwt")
@Controller("email-address-templates")
@UseGuards(JwtAuthGuard, CaslGuard)
export class EmailAddressTemplatesController {
  constructor(private readonly service: EmailAddressTemplatesService) {}

  @Post()
  @ApiOperation({ summary: "Créer un template d’adresse email" })
  @CheckAbilities({ action: "create", subject: "EmailAddressTemplate" })
  create(@Body() dto: CreateEmailAddressTemplateDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les templates d’adresse email" })
  @ApiQuery({
    name: "activeOnly",
    required: false,
    type: Boolean,
    description: "Si true: renvoie uniquement les templates actifs",
  })
  @CheckAbilities({ action: "read", subject: "EmailAddressTemplate" })
  findAll(@Query("activeOnly") activeOnly?: string) {
    return this.service.findAll({ activeOnly: activeOnly === "true" });
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un template d’adresse email" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "read", subject: "EmailAddressTemplate" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour un template d’adresse email" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "EmailAddressTemplate" })
  update(@Param("id") id: string, @Body() dto: UpdateEmailAddressTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un template d’adresse email" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "delete", subject: "EmailAddressTemplate" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
