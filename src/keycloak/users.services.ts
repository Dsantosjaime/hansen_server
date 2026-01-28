// src/keycloak/keycloak-admin-users.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type KcAdminClientInstance = {
  auth: (args: {
    grantType: "client_credentials";
    clientId: string;
    clientSecret: string;
  }) => Promise<void>;
  users: {
    create: (data: any) => Promise<{ id?: string }>;
    update: (args: { id: string }, data: any) => Promise<void>;
    resetPassword: (args: { id: string; credential: any }) => Promise<void>;
    findOne: (args: { id: string }) => Promise<any>;
    del: (args: { id: string }) => Promise<void>;
  };
};

export type KeycloakUser = {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
};

export type UpdateKeycloakUserInput = {
  email?: string | null;
  name?: string | null;
  enabled?: boolean;
  // si tu veux gérer plus tard:
  // firstName?: string | null;
  // lastName?: string | null;
};

@Injectable()
export class KeycloakAdminUsersService {
  private kc: KcAdminClientInstance | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getClient(): Promise<KcAdminClientInstance> {
    if (this.kc) return this.kc;

    const mod = await import("@keycloak/keycloak-admin-client");
    const KcAdminClient = mod.default as unknown as new (args: {
      baseUrl: string;
      realmName: string;
    }) => KcAdminClientInstance;

    this.kc = new KcAdminClient({
      baseUrl: this.config.getOrThrow<string>("KEYCLOAK_BASE_URL"),
      realmName: this.config.getOrThrow<string>("KEYCLOAK_REALM"),
    });

    return this.kc;
  }

  private async authAdmin(kc: KcAdminClientInstance) {
    await kc.auth({
      grantType: "client_credentials",
      clientId: this.config.getOrThrow<string>("KEYCLOAK_ADMIN_CLIENT_ID"),
      clientSecret: this.config.getOrThrow<string>("KEYCLOAK_CLIENT_SECRET"),
    });
  }

  private normalizeUser(id: string, raw: unknown): KeycloakUser {
    const u = (raw ?? {}) as Record<string, unknown>;
    return {
      id,
      email: typeof u.email === "string" ? u.email : undefined,
      username: typeof u.username === "string" ? u.username : undefined,
      firstName: typeof u.firstName === "string" ? u.firstName : undefined,
      lastName: typeof u.lastName === "string" ? u.lastName : undefined,
      enabled: typeof u.enabled === "boolean" ? u.enabled : undefined,
    };
  }

  async setTemporaryPassword(
    keycloakUserId: string,
    password: string,
    temporary = true,
  ): Promise<void> {
    const kc = await this.getClient();
    await this.authAdmin(kc);

    await kc.users.resetPassword({
      id: keycloakUserId,
      credential: {
        type: "password",
        value: password,
        temporary,
      },
    });
  }

  async createUser(
    name: string,
    email: string,
    temporaryPassword: string,
  ): Promise<KeycloakUser> {
    const kc = await this.getClient();
    await this.authAdmin(kc);

    const created = await kc.users.create({
      username: email,
      email,
      firstName: name,
      enabled: true,
    });

    if (!created.id) {
      throw new InternalServerErrorException("Keycloak did not return user id");
    }

    await this.setTemporaryPassword(created.id, temporaryPassword, true);

    const raw = (await kc.users.findOne({ id: created.id })) as unknown;
    return this.normalizeUser(created.id, raw);
  }

  async updateUser(
    keycloakUserId: string,
    input: UpdateKeycloakUserInput,
  ): Promise<KeycloakUser> {
    const kc = await this.getClient();
    await this.authAdmin(kc);

    const data: Record<string, unknown> = {};

    if (input.email !== undefined) {
      if (input.email === null) {
        // Keycloak n'aime pas forcément email=null, on met plutôt undefined / skip
        // Ici on choisit de skip si null (à ajuster selon votre règle métier)
      } else {
        data.email = input.email;
        data.username = input.email;
      }
    }

    if (input.name !== undefined) {
      if (input.name === null) data.firstName = "";
      else data.firstName = input.name;
    }

    if (input.enabled !== undefined) {
      data.enabled = input.enabled;
    }

    // Si aucun champ à update, on renvoie l’état courant
    if (Object.keys(data).length > 0) {
      await kc.users.update({ id: keycloakUserId }, data);
    }

    const raw = (await kc.users.findOne({ id: keycloakUserId })) as unknown;

    if (!raw) {
      throw new InternalServerErrorException(
        "Keycloak user not found after update (unexpected)",
      );
    }

    return this.normalizeUser(keycloakUserId, raw);
  }

  async deleteUser(keycloakUserId: string): Promise<void> {
    const kc = await this.getClient();
    await this.authAdmin(kc);
    await kc.users.del({ id: keycloakUserId });
  }
}
