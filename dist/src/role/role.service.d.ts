import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { BrevoMarketingService } from "src/brevo/brevo-marketing.service";
export declare class RoleService {
    private readonly prisma;
    private readonly brevoMarketing;
    constructor(prisma: PrismaService, brevoMarketing: BrevoMarketingService);
    create(dto: CreateRoleDto): Promise<{
        name: string;
        id: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
    findAll(): Promise<{
        name: string;
        id: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        name: string;
        id: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        isSystem: boolean;
        permissions: {
            subject: string;
            action: string;
        }[];
    }>;
}
