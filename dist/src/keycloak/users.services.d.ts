import { ConfigService } from "@nestjs/config";
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
};
export declare class KeycloakAdminUsersService {
    private readonly config;
    private kc;
    constructor(config: ConfigService);
    private getClient;
    private authAdmin;
    private normalizeUser;
    setTemporaryPassword(keycloakUserId: string, password: string, temporary?: boolean): Promise<void>;
    createUser(name: string, email: string, temporaryPassword: string): Promise<KeycloakUser>;
    updateUser(keycloakUserId: string, input: UpdateKeycloakUserInput): Promise<KeycloakUser>;
    deleteUser(keycloakUserId: string): Promise<void>;
}
