import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.AnyNull);
};
export declare const DbNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const JsonNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const AnyNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const ModelName: {
    readonly User: "User";
    readonly PermissionGroup: "PermissionGroup";
    readonly Role: "Role";
    readonly Group: "Group";
    readonly SubGroup: "SubGroup";
    readonly Contact: "Contact";
    readonly EmailSend: "EmailSend";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly keycloakId: "keycloakId";
    readonly email: "email";
    readonly name: "name";
    readonly roleId: "roleId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const PermissionGroupScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
};
export type PermissionGroupScalarFieldEnum = (typeof PermissionGroupScalarFieldEnum)[keyof typeof PermissionGroupScalarFieldEnum];
export declare const RoleScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly isSystem: "isSystem";
};
export type RoleScalarFieldEnum = (typeof RoleScalarFieldEnum)[keyof typeof RoleScalarFieldEnum];
export declare const GroupScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
};
export type GroupScalarFieldEnum = (typeof GroupScalarFieldEnum)[keyof typeof GroupScalarFieldEnum];
export declare const SubGroupScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly groupId: "groupId";
    readonly brevoListId: "brevoListId";
};
export type SubGroupScalarFieldEnum = (typeof SubGroupScalarFieldEnum)[keyof typeof SubGroupScalarFieldEnum];
export declare const ContactScalarFieldEnum: {
    readonly id: "id";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly function: "function";
    readonly status: "status";
    readonly email: "email";
    readonly phoneNumber: "phoneNumber";
    readonly lastContact: "lastContact";
    readonly lastEmail: "lastEmail";
    readonly groupId: "groupId";
    readonly subGroupId: "subGroupId";
};
export type ContactScalarFieldEnum = (typeof ContactScalarFieldEnum)[keyof typeof ContactScalarFieldEnum];
export declare const EmailSendScalarFieldEnum: {
    readonly id: "id";
    readonly contactId: "contactId";
    readonly email: "email";
    readonly brevoCampaignId: "brevoCampaignId";
    readonly subject: "subject";
    readonly status: "status";
    readonly sentAt: "sentAt";
    readonly deliveredAt: "deliveredAt";
    readonly openedAt: "openedAt";
    readonly clickedAt: "clickedAt";
    readonly bouncedAt: "bouncedAt";
    readonly unsubscribedAt: "unsubscribedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type EmailSendScalarFieldEnum = (typeof EmailSendScalarFieldEnum)[keyof typeof EmailSendScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
