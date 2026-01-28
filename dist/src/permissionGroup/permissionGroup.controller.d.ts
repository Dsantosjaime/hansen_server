import { PermissionGroupService } from './permissionGroup.service';
export declare class PermissionGroupController {
    private readonly permissionGroupService;
    constructor(permissionGroupService: PermissionGroupService);
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
