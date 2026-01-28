import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RoleService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRoleDto): Promise<{
        id: string;
        name: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        id: string;
        name: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
}
