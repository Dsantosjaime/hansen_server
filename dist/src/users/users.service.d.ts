import { PrismaService } from "src/prisma/prisma.service";
import type { KeycloakJwtPayload } from "src/auth/keycloack-user.type";
import { Prisma } from "generated/prisma/client";
import { KeycloakAdminUsersService } from "src/keycloak/users.services";
export type UserWithRole = Prisma.UserGetPayload<{
    include: {
        role: true;
    };
}>;
type UpdateUserInput = {
    name?: string | null;
    email?: string | null;
    roleId?: string;
    temporaryPassword?: string;
};
export declare class UsersService {
    private readonly prisma;
    private readonly keycloakAdminUsers;
    constructor(prisma: PrismaService, keycloakAdminUsers: KeycloakAdminUsersService);
    private safeDeleteKeycloakUser;
    getUsers(): Promise<UserWithRole[]>;
    createUserWithRole(name: string, temporaryPassword: string, roleId: string, email: string): Promise<UserWithRole>;
    updateUser(userId: string, input: UpdateUserInput): Promise<UserWithRole>;
    deleteUser(userId: string): Promise<UserWithRole>;
    updateFromKeycloak(payload: KeycloakJwtPayload): Promise<UserWithRole>;
}
export {};
