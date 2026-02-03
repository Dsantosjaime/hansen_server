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
import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@ApiTags("contacts")
@ApiBearerAuth("jwt")
@Controller("contacts")
@UseGuards(JwtAuthGuard, CaslGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: "Créer un contact" })
  @CheckAbilities({ action: "create", subject: "Contact" })
  create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les contacts (filtres optionnels)" })
  @ApiQuery({ name: "groupId", required: false, type: String })
  @ApiQuery({ name: "subGroupId", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @CheckAbilities({ action: "read", subject: "Contact" })
  findAll(
    @Query("groupId") groupId?: string,
    @Query("subGroupId") subGroupId?: string,
    @Query("status") status?: string,
  ) {
    return this.contactsService.findAll({ groupId, subGroupId, status });
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un contact par id" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "read", subject: "Contact" })
  findOne(@Param("id") id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour un contact" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Contact" })
  update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un contact" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "delete", subject: "Contact" })
  remove(@Param("id") id: string) {
    return this.contactsService.remove(id);
  }
}
