import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import type { KeycloakJwtPayload } from "src/auth/keycloack-user.type";
import { Prisma } from "generated/prisma/client";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";
import { KeycloakAdminUsersService } from "src/keycloak/users.services";

export type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

type UpdateUserInput = {
  name?: string | null;
  email?: string | null;
  roleId?: string;
  temporaryPassword?: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloakAdminUsers: KeycloakAdminUsersService,
  ) {}

  private async safeDeleteKeycloakUser(keycloakUserId: string) {
    await this.keycloakAdminUsers
      .deleteUser(keycloakUserId)
      .catch(() => undefined);
  }

  async getUsers(): Promise<UserWithRole[]> {
    return this.prisma.user.findMany({
      include: { role: true },
    });
  }

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
      throw new Error("Keycloak user id missing after creation");
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
      await this.safeDeleteKeycloakUser(kcUser.id);
      throw e;
    }
  }

  async updateUser(
    userId: string,
    input: UpdateUserInput,
  ): Promise<UserWithRole> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!existing) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (input.email !== undefined || input.name !== undefined) {
      await this.keycloakAdminUsers.updateUser(existing.keycloakId, {
        email: input.email ?? undefined,
        name: input.name ?? undefined,
      });
    }

    if (input.temporaryPassword) {
      await this.keycloakAdminUsers.setTemporaryPassword(
        existing.keycloakId,
        input.temporaryPassword,
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.roleId ? { role: { connect: { id: input.roleId } } } : {}),
      },
      include: { role: true },
    });
  }

  async deleteUser(userId: string): Promise<UserWithRole> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!existing) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.keycloakAdminUsers.deleteUser(existing.keycloakId);

    return this.prisma.user.delete({
      where: { id: userId },
      include: { role: true },
    });
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
