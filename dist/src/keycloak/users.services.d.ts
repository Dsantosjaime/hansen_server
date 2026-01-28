import { ConfigService } from '@nestjs/config';
export type KeycloakUser = {
    id: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
};
export declare class KeycloakAdminUsersService {
    private readonly config;
    private kc;
    constructor(config: ConfigService);
    private getClient;
    private authAdmin;
    createUser(name: string, email: string, temporaryPassword: string): Promise<KeycloakUser>;
    deleteUser(keycloakUserId: string): Promise<void>;
}
