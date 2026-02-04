"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineExtension = exports.QueryMode = exports.SortOrder = exports.CampaignAttachmentScalarFieldEnum = exports.EmailSendScalarFieldEnum = exports.ContactScalarFieldEnum = exports.SubGroupScalarFieldEnum = exports.GroupScalarFieldEnum = exports.RoleScalarFieldEnum = exports.PermissionGroupScalarFieldEnum = exports.UserScalarFieldEnum = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = __importStar(require("@prisma/client/runtime/library"));
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "6.19.2",
    engine: "c2990dca591cba766e3b7ef5d9e8a84796e47ab7"
};
exports.NullTypes = {
    DbNull: runtime.objectEnumValues.classes.DbNull,
    JsonNull: runtime.objectEnumValues.classes.JsonNull,
    AnyNull: runtime.objectEnumValues.classes.AnyNull,
};
exports.DbNull = runtime.objectEnumValues.instances.DbNull;
exports.JsonNull = runtime.objectEnumValues.instances.JsonNull;
exports.AnyNull = runtime.objectEnumValues.instances.AnyNull;
exports.ModelName = {
    User: 'User',
    PermissionGroup: 'PermissionGroup',
    Role: 'Role',
    Group: 'Group',
    SubGroup: 'SubGroup',
    Contact: 'Contact',
    EmailSend: 'EmailSend',
    CampaignAttachment: 'CampaignAttachment'
};
exports.UserScalarFieldEnum = {
    id: 'id',
    keycloakId: 'keycloakId',
    email: 'email',
    name: 'name',
    roleId: 'roleId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.PermissionGroupScalarFieldEnum = {
    id: 'id',
    name: 'name'
};
exports.RoleScalarFieldEnum = {
    id: 'id',
    name: 'name',
    isSystem: 'isSystem'
};
exports.GroupScalarFieldEnum = {
    id: 'id',
    name: 'name'
};
exports.SubGroupScalarFieldEnum = {
    id: 'id',
    name: 'name',
    groupId: 'groupId',
    brevoListId: 'brevoListId'
};
exports.ContactScalarFieldEnum = {
    id: 'id',
    firstName: 'firstName',
    lastName: 'lastName',
    function: 'function',
    status: 'status',
    email: 'email',
    phoneNumber: 'phoneNumber',
    lastContact: 'lastContact',
    lastEmail: 'lastEmail',
    groupId: 'groupId',
    subGroupId: 'subGroupId'
};
exports.EmailSendScalarFieldEnum = {
    id: 'id',
    contactId: 'contactId',
    email: 'email',
    brevoCampaignId: 'brevoCampaignId',
    subject: 'subject',
    status: 'status',
    sentAt: 'sentAt',
    deliveredAt: 'deliveredAt',
    openedAt: 'openedAt',
    clickedAt: 'clickedAt',
    bouncedAt: 'bouncedAt',
    unsubscribedAt: 'unsubscribedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CampaignAttachmentScalarFieldEnum = {
    id: 'id',
    token: 'token',
    filename: 'filename',
    mimeType: 'mimeType',
    size: 'size',
    path: 'path',
    createdAt: 'createdAt',
    expiresAt: 'expiresAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map