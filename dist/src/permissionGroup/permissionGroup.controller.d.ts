import { PermissionGroupService } from './permissionGroup.service';
export declare class PermissionGroupController {
    private readonly permissionGroupService;
    constructor(permissionGroupService: PermissionGroupService);
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
