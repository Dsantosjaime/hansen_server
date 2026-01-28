import { PrismaService } from 'src/prisma/prisma.service';
import type { KeycloakJwtPayload } from 'src/auth/keycloack-user.type';
import { Prisma } from 'generated/prisma/client';
import { KeycloakAdminUsersService } from 'src/keycloak/users.services';
export type UserWithRole = Prisma.UserGetPayload<{
    include: {
        role: true;
    };
}>;
export declare class UsersService {
    private readonly prisma;
    private readonly keycloakAdminUsers;
    constructor(prisma: PrismaService, keycloakAdminUsers: KeycloakAdminUsersService);
    createUserWithRole(name: string, temporaryPassword: string, roleId: string, email: string): Promise<UserWithRole>;
    updateFromKeycloak(payload: KeycloakJwtPayload): Promise<UserWithRole>;
}
