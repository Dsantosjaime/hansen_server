import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionGroupService } from './permissionGroup.service';
import { CaslGuard } from 'src/casl/casl.guard';
import { CheckAbilities } from 'src/casl/check-abilities.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('permissionGroup')
@ApiBearerAuth('jwt')
@Controller('permission-groups')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PermissionGroupController {
  constructor(
    private readonly permissionGroupService: PermissionGroupService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Recuperer les groupes de permission',
  })
  @CheckAbilities({ action: 'read', subject: 'PermissionGroup' })
  async getPermissionGroups() {
    return this.permissionGroupService.getPermissionGroups();
  }
}
