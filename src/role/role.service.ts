import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        permissions: dto.permissions,
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.permissions !== undefined
          ? { permissions: dto.permissions }
          : {}),
      },
    });
  }

  async remove(id: string) {
    const toRemove = await this.findOne(id);
    if (toRemove.isSystem) {
      throw new ForbiddenException(
        'Ce rôle système ne peut pas être supprimé.',
      );
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
