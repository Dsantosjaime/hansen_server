import { PrismaService } from 'src/prisma/prisma.service';
export declare class PermissionGroupService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPermissionGroups(): Promise<{
        id: string;
        name: string;
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
