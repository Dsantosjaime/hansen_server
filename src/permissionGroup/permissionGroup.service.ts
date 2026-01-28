// src/permission-groups/permission-group.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissionGroups() {
    return this.prisma.permissionGroup.findMany();
  }
}
