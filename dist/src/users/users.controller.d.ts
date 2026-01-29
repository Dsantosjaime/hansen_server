import { UsersService } from "./users.service";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
        keycloakId: string;
        roleId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
        keycloakId: string;
        roleId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
        keycloakId: string;
        roleId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
        keycloakId: string;
        roleId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
