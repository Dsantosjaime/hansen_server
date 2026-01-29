import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";

@ApiTags("groups")
@ApiBearerAuth("jwt")
@Controller("groups")
@UseGuards(JwtAuthGuard, CaslGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: "Créer un group" })
  @CheckAbilities({ action: "create", subject: "Group" })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les groups" })
  @CheckAbilities({ action: "read", subject: "Group" })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un group par id" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "read", subject: "Group" })
  findOne(@Param("id") id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour un group" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "Group" })
  update(@Param("id") id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un group (cascade subGroups)" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "delete", subject: "Group" })
  remove(@Param("id") id: string) {
    return this.groupsService.remove(id);
  }
}
