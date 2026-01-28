import { MongoAbility } from '@casl/ability';
import type { Permission } from 'generated/prisma/client';
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'copy';
export type Subjects = 'all' | 'Post' | 'User' | 'Role';
export type AppAbility = MongoAbility<[Actions, Subjects]>;
export declare class CaslAbilityFactory {
    createFor(user: {
        isSuperAdmin: boolean;
        permissions: Permission[];
    }): AppAbility;
}
