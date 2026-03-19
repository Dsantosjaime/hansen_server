import { UsersService } from "./users.service";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RequestWithAuth } from "@/auth/request-with-user.type";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: RequestWithAuth): Promise<{
        role: {
            name: string;
            id: string;
            isSystem: boolean;
            permissions: {
                subject: string;
                action: string;
            }[];
        } | null;
    } & {
        email: string | null;
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keycloakId: string;
        roleId: string | null;
        brevoSenderId: number | null;
    }>;
    getUsers(): Promise<({
        role: {
            name: string;
            id: string;
            isSystem: boolean;
            permissions: {
                subject: string;
                action: string;
            }[];
        } | null;
    } & {
        email: string | null;
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keycloakId: string;
        roleId: string | null;
        brevoSenderId: number | null;
    })[]>;
    createUser(dto: CreateUserWithRoleDto): Promise<{
        role: {
            name: string;
            id: string;
            isSystem: boolean;
            permissions: {
                subject: string;
                action: string;
            }[];
        } | null;
    } & {
        email: string | null;
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keycloakId: string;
        roleId: string | null;
        brevoSenderId: number | null;
    }>;
    updateUser(id: string, dto: UpdateUserDto): Promise<{
        role: {
            name: string;
            id: string;
            isSystem: boolean;
            permissions: {
                subject: string;
                action: string;
            }[];
        } | null;
    } & {
        email: string | null;
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keycloakId: string;
        roleId: string | null;
        brevoSenderId: number | null;
    }>;
    deleteUser(id: string): Promise<{
        role: {
            name: string;
            id: string;
            isSystem: boolean;
            permissions: {
                subject: string;
                action: string;
            }[];
        } | null;
    } & {
        email: string | null;
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        keycloakId: string;
        roleId: string | null;
        brevoSenderId: number | null;
    }>;
}
