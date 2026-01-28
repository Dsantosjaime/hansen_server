// src/keycloak/keycloak-admin-users.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type KcAdminClientInstance = {
  auth: (args: {
    grantType: 'client_credentials';
    clientId: string;
    clientSecret: string;
  }) => Promise<void>;
  users: {
    create: (data: any) => Promise<{ id?: string }>;
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

@Injectable()
export class KeycloakAdminUsersService {
  private kc: KcAdminClientInstance | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getClient(): Promise<KcAdminClientInstance> {
    if (this.kc) return this.kc;

    const mod = await import('@keycloak/keycloak-admin-client');
    const KcAdminClient = mod.default as unknown as new (args: {
      baseUrl: string;
      realmName: string;
    }) => KcAdminClientInstance;

    this.kc = new KcAdminClient({
      baseUrl: this.config.getOrThrow<string>('KEYCLOAK_BASE_URL'),
      realmName: this.config.getOrThrow<string>('KEYCLOAK_REALM'),
    });

    return this.kc;
  }

  private async authAdmin(kc: KcAdminClientInstance) {
    await kc.auth({
      grantType: 'client_credentials',
      clientId: this.config.getOrThrow<string>('KEYCLOAK_ADMIN_CLIENT_ID'),
      clientSecret: this.config.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET'),
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
      throw new InternalServerErrorException('Keycloak did not return user id');
    }

    await kc.users.resetPassword({
      id: created.id,
      credential: {
        type: 'password',
        value: temporaryPassword,
        temporary: true,
      },
    });

    const raw = (await kc.users.findOne({ id: created.id })) as unknown;

    const u = (raw ?? {}) as Record<string, unknown>;

    return {
      id: created.id,
      email: typeof u.email === 'string' ? u.email : undefined,
      username: typeof u.username === 'string' ? u.username : undefined,
      firstName: typeof u.firstName === 'string' ? u.firstName : undefined,
      lastName: typeof u.lastName === 'string' ? u.lastName : undefined,
      enabled: typeof u.enabled === 'boolean' ? u.enabled : undefined,
    };
  }

  async deleteUser(keycloakUserId: string) {
    const kc = await this.getClient();
    await this.authAdmin(kc);
    await kc.users.del({ id: keycloakUserId });
  }
}
