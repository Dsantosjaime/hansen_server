import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CaslGuard } from 'src/casl/casl.guard';
import { CheckAbilities } from 'src/casl/check-abilities.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, CaslGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un rôle' })
  @CheckAbilities({ action: 'create', subject: 'Role' })
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les rôles' })
  @CheckAbilities({ action: 'read', subject: 'Role' })
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rôle par id' })
  @ApiParam({ name: 'id', type: String })
  @CheckAbilities({ action: 'read', subject: 'Role' })
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiParam({ name: 'id', type: String })
  @CheckAbilities({ action: 'update', subject: 'Role' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiParam({ name: 'id', type: String })
  @CheckAbilities({ action: 'delete', subject: 'Role' })
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
