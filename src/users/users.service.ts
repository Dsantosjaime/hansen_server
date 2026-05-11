import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import type { KeycloakJwtPayload } from "src/auth/keycloack-user.type";
import { Prisma } from "generated/prisma/client";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";
import { KeycloakAdminUsersService } from "src/keycloak/users.services";
import { BrevoMarketingService } from "src/brevo/brevo-marketing.service";
import { hasPermission } from "src/auth/permissions.util";

export type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

type CreateUserInput = {
  name: string;
  email: string;
  temporaryPassword: string;
  roleId: string;
  jobTitle?: string;
  phoneFixed?: string;
  phoneMobile?: string;
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  roleId?: string;
  temporaryPassword?: string;
  jobTitle?: string | null;
  phoneFixed?: string | null;
  phoneMobile?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloakAdminUsers: KeycloakAdminUsersService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

  private async safeDeleteKeycloakUser(keycloakUserId: string) {
    await this.keycloakAdminUsers
      .deleteUser(keycloakUserId)
      .catch(() => undefined);
  }

  private canCreateEmail(user: UserWithRole): boolean {
    return hasPermission(user.role, "Email", "create");
  }

  private async ensureBrevoSenderForUserId(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!this.canCreateEmail(user)) return;

    if (!user.email) {
      throw new Error("User email is required to create a Brevo sender");
    }

    if (user.brevoSenderId) return;

    const senderId = await this.brevoMarketing.createSender({
      name: user.name ?? user.email,
      email: user.email,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { brevoSenderId: senderId },
    });
  }

  private async removeBrevoSenderForUserId(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const senderId = user.brevoSenderId;
    if (!senderId) return;

    await this.brevoMarketing.deleteSender(senderId).catch(() => undefined);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { brevoSenderId: null },
    });
  }

  private async handleEmailChangeIfNeeded(
    before: UserWithRole,
    after: UserWithRole,
  ) {
    const emailChanged = (before.email ?? null) !== (after.email ?? null);
    if (!emailChanged) return;

    if (!this.canCreateEmail(after)) return;

    if (before.brevoSenderId) {
      await this.brevoMarketing
        .deleteSender(before.brevoSenderId)
        .catch(() => undefined);
    }

    if (!after.email) {
      await this.prisma.user.update({
        where: { id: after.id },
        data: { brevoSenderId: null },
      });
      return;
    }

    const newSenderId = await this.brevoMarketing.createSender({
      name: after.name ?? after.email,
      email: after.email,
    });

    await this.prisma.user.update({
      where: { id: after.id },
      data: { brevoSenderId: newSenderId },
    });
  }

  async getUsers(): Promise<UserWithRole[]> {
    return this.prisma.user.findMany({
      include: { role: true },
    });
  }

  async createUserWithRole(input: CreateUserInput): Promise<UserWithRole> {
    const kcUser = await this.keycloakAdminUsers.createUser(
      input.name,
      input.email,
      input.temporaryPassword,
    );

    if (!kcUser?.id) {
      throw new Error("Keycloak user id missing after creation");
    }

    try {
      const created = await this.prisma.user.create({
        data: {
          keycloakId: kcUser.id,
          email: input.email,
          name: input.name,
          role: { connect: { id: input.roleId } },
          ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
          ...(input.phoneFixed !== undefined
            ? { phoneFixed: input.phoneFixed }
            : {}),
          ...(input.phoneMobile !== undefined
            ? { phoneMobile: input.phoneMobile }
            : {}),
        },
        include: { role: true },
      });

      if (this.canCreateEmail(created)) {
        await this.ensureBrevoSenderForUserId(created.id);
        return this.prisma.user.findUniqueOrThrow({
          where: { id: created.id },
          include: { role: true },
        });
      }

      return created;
    } catch (e) {
      await this.safeDeleteKeycloakUser(kcUser.id);
      throw e;
    }
  }

  async getUserByKeycloakId(keycloakId: string): Promise<UserWithRole> {
    const user = await this.prisma.user.findUnique({
      where: { keycloakId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User with keycloakId=${keycloakId} not found`,
      );
    }

    return user;
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
        email: input.email,
        name: input.name,
      });
    }

    if (input.temporaryPassword) {
      await this.keycloakAdminUsers.setTemporaryPassword(
        existing.keycloakId,
        input.temporaryPassword,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.roleId ? { role: { connect: { id: input.roleId } } } : {}),
        // Champs nullables : undefined = ne pas toucher, null = effacer
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
        ...(input.phoneFixed !== undefined
          ? { phoneFixed: input.phoneFixed }
          : {}),
        ...(input.phoneMobile !== undefined
          ? { phoneMobile: input.phoneMobile }
          : {}),
      },
      include: { role: true },
    });

    const beforeCan = this.canCreateEmail(existing);
    const afterCan = this.canCreateEmail(updated);

    if (!beforeCan && afterCan) {
      await this.ensureBrevoSenderForUserId(updated.id);
    } else if (beforeCan && !afterCan) {
      await this.removeBrevoSenderForUserId(updated.id);
    } else {
      await this.handleEmailChangeIfNeeded(existing, updated);
    }

    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
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

    await this.removeBrevoSenderForUserId(existing.id).catch(() => undefined);

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
          email: payload.email ?? undefined,
          name: payload.name ?? payload.preferred_username ?? undefined,
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
