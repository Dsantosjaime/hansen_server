import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { hasPermission } from "src/auth/permissions.util";
import { BrevoMarketingService } from "src/brevo/brevo-marketing.service";

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

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
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const before = await this.findOne(id);

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.permissions !== undefined
          ? { permissions: dto.permissions }
          : {}),
      },
    });

    // Si permissions non modifiées => rien à faire
    if (dto.permissions === undefined) return updated;

    const beforeCanCreateEmail = hasPermission(before, "Email", "create");
    const afterCanCreateEmail = hasPermission(updated, "Email", "create");

    if (beforeCanCreateEmail === afterCanCreateEmail) {
      return updated;
    }

    // Vu le volume (<=10 users), on fait simple et synchrone
    const users = await this.prisma.user.findMany({
      where: { roleId: updated.id },
      select: { id: true, email: true, name: true, brevoSenderId: true },
    });

    if (!beforeCanCreateEmail && afterCanCreateEmail) {
      // Le rôle gagne Email:create => provisionne senders
      for (const u of users) {
        if (u.brevoSenderId) continue;
        if (!u.email) continue;

        const senderId = await this.brevoMarketing
          .createSender({ name: u.name ?? u.email, email: u.email })
          .catch(() => null);

        if (senderId) {
          await this.prisma.user.update({
            where: { id: u.id },
            data: { brevoSenderId: senderId },
          });
        }
      }
    }

    if (beforeCanCreateEmail && !afterCanCreateEmail) {
      // Le rôle perd Email:create => supprime senders
      for (const u of users) {
        if (!u.brevoSenderId) continue;

        await this.brevoMarketing
          .deleteSender(u.brevoSenderId)
          .catch(() => undefined);

        await this.prisma.user.update({
          where: { id: u.id },
          data: { brevoSenderId: null },
        });
      }
    }

    return updated;
  }

  async remove(id: string) {
    const toRemove = await this.findOne(id);
    if (toRemove.isSystem) {
      throw new ForbiddenException(
        "Ce rôle système ne peut pas être supprimé.",
      );
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
