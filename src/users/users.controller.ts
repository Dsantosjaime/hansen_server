import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserWithRoleDto } from './dto/create-user-with-role.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CaslGuard } from 'src/casl/casl.guard';
import { CheckAbilities } from 'src/casl/check-abilities.decorator';

@ApiTags('users')
@ApiBearerAuth('jwt')
@Controller('users')
@UseGuards(JwtAuthGuard, CaslGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un utilisateur (Keycloak + Mongo) avec rôle',
  })
  @CheckAbilities({ action: 'create', subject: 'User' })
  async createUser(@Body() dto: CreateUserWithRoleDto) {
    return this.usersService.createUserWithRole(
      dto.name,
      dto.temporaryPassword,
      dto.roleId,
      dto.email,
    );
  }
}
