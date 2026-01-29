import { PrismaService } from 'src/prisma/prisma.service';
export declare class PermissionGroupService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPermissionGroups(): Promise<{
        name: string;
        id: string;
        permissionSubGroup: ({
            name: string;
        } & {
            permissions: {
                subject: string;
                action: string;
            }[];
        })[];
    }[]>;
}
