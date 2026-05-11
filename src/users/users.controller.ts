import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
import { RequestWithAuth } from "@/auth/request-with-user.type";

@ApiTags("users")
@ApiBearerAuth("jwt")
@Controller("users")
@UseGuards(JwtAuthGuard, CaslGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({
    summary:
      "Retourne l'utilisateur courant (Mongo) avec son rôle et permissions",
  })
  async getMe(@Req() req: RequestWithAuth) {
    const kcUser = req.user;

    if (!kcUser?.sub) {
      throw new ForbiddenException("Missing user");
    }
    return this.usersService.getUserByKeycloakId(kcUser.sub);
  }

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
    return this.usersService.createUserWithRole({
      name: dto.name,
      email: dto.email,
      temporaryPassword: dto.temporaryPassword,
      roleId: dto.roleId,
      jobTitle: dto.jobTitle,
      phoneFixed: dto.phoneFixed,
      phoneMobile: dto.phoneMobile,
    });
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
      jobTitle: dto.jobTitle,
      phoneFixed: dto.phoneFixed,
      phoneMobile: dto.phoneMobile,
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
