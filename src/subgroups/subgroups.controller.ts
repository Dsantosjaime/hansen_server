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
import { SubGroupsService } from "./subgroups.service";
import { CreateSubGroupDto } from "./dto/create-sub-group.dto";
import { UpdateSubGroupDto } from "./dto/update-sub-group.dto";

@ApiTags("subgroups")
@ApiBearerAuth("jwt")
@Controller("subgroups")
@UseGuards(JwtAuthGuard, CaslGuard)
export class SubGroupsController {
  constructor(private readonly subGroupsService: SubGroupsService) {}

  @Post()
  @ApiOperation({ summary: "Créer un subGroup" })
  @CheckAbilities({ action: "create", subject: "Subgroup" })
  create(@Body() dto: CreateSubGroupDto) {
    return this.subGroupsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: "Lister les subGroups (option: filtrer par groupId)",
  })
  @ApiQuery({ name: "groupId", required: false, type: String })
  @CheckAbilities({ action: "read", subject: "Subgroup" })
  findAll(@Query("groupId") groupId?: string) {
    return this.subGroupsService.findAll(groupId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un subGroup par id" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "read", subject: "Subgroup" })
  findOne(@Param("id") id: string) {
    return this.subGroupsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour un subGroup" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Subgroup" })
  update(@Param("id") id: string, @Body() dto: UpdateSubGroupDto) {
    return this.subGroupsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un subGroup" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "delete", subject: "Subgroup" })
  remove(@Param("id") id: string) {
    return this.subGroupsService.remove(id);
  }
}
