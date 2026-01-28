import { UsersService } from './users.service';
import { CreateUserWithRoleDto } from './dto/create-user-with-role.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserWithRoleDto): Promise<{
        role: {
            id: string;
            name: string;
            isSystem: boolean;
            permissions: {
                subject: string;
                action: string;
            }[];
        } | null;
    } & {
        id: string;
        email: string | null;
        name: string | null;
        keycloakId: string;
        roleId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
