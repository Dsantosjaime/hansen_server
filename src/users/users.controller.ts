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
import { UsersService } from "./users.service";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CaslGuard } from "src/casl/casl.guard";
import { CheckAbilities } from "src/casl/check-abilities.decorator";

@ApiTags("users")
@ApiBearerAuth("jwt")
@Controller("users")
@UseGuards(JwtAuthGuard, CaslGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Lister les utilisateurs (Mongo) avec leur rôle" })
  @CheckAbilities({ action: "read", subject: "User" })
  async getUsers() {
    return this.usersService.getUsers();
  }

  @Post()
  @ApiOperation({
    summary: "Créer un utilisateur (Keycloak + Mongo) avec rôle",
  })
  @CheckAbilities({ action: "create", subject: "User" })
  async createUser(@Body() dto: CreateUserWithRoleDto) {
    return this.usersService.createUserWithRole(
      dto.name,
      dto.temporaryPassword,
      dto.roleId,
      dto.email,
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Mettre à jour un utilisateur (Keycloak + Mongo)" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "update", subject: "User" })
  async updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, {
      name: dto.name,
      email: dto.email,
      roleId: dto.roleId,
      temporaryPassword: dto.temporaryPassword,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer un utilisateur (Keycloak + Mongo)" })
  @ApiParam({ name: "id", type: String })
  @CheckAbilities({ action: "delete", subject: "User" })
  async deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }
}
