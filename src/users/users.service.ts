import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { KeycloakJwtPayload } from 'src/auth/keycloack-user.type';
import { Prisma } from 'generated/prisma/client';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { KeycloakAdminUsersService } from 'src/keycloak/users.services';

export type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloakAdminUsers: KeycloakAdminUsersService,
  ) {}

  async createUserWithRole(
    name: string,
    temporaryPassword: string,
    roleId: string,
    email: string,
  ): Promise<UserWithRole> {
    const kcUser = await this.keycloakAdminUsers.createUser(
      name,
      email,
      temporaryPassword,
    );

    if (!kcUser?.id) {
      throw new Error('Keycloak user id missing after creation');
    }

    try {
      return await this.prisma.user.create({
        data: {
          keycloakId: kcUser.id,
          email: email ?? null,
          name: name ?? null,
          role: { connect: { id: roleId } },
        },
        include: { role: true },
      });
    } catch (e) {
      await this.keycloakAdminUsers
        .deleteUser(kcUser.id)
        .catch(() => undefined);
      throw e;
    }
  }

  async updateFromKeycloak(payload: KeycloakJwtPayload): Promise<UserWithRole> {
    try {
      return await this.prisma.user.update({
        where: { keycloakId: payload.sub },
        data: {
          email: payload.email ?? null,
          name: payload.name ?? payload.preferred_username ?? null,
        },
        include: { role: true },
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException(
          `User with keycloakId=${payload.sub} not found (must be created via API before syncing from Keycloak).`,
        );
      }
      throw err;
    }
  }
}
