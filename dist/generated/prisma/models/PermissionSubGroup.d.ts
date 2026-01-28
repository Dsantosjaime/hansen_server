import type * as runtime from "@prisma/client/runtime/library";
import type * as Prisma from "../internal/prismaNamespace";
export type PermissionSubGroupModel = runtime.Types.Result.DefaultSelection<Prisma.$PermissionSubGroupPayload>;
export type PermissionSubGroupCompositeListFilter = {
    equals?: Prisma.PermissionSubGroupObjectEqualityInput[];
    every?: Prisma.PermissionSubGroupWhereInput;
    some?: Prisma.PermissionSubGroupWhereInput;
    none?: Prisma.PermissionSubGroupWhereInput;
    isEmpty?: boolean;
    isSet?: boolean;
};
export type PermissionSubGroupOrderByCompositeAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PermissionSubGroupListCreateEnvelopeInput = {
    set?: Prisma.PermissionSubGroupCreateInput | Prisma.PermissionSubGroupCreateInput[];
};
export type PermissionSubGroupListUpdateEnvelopeInput = {
    set?: Prisma.PermissionSubGroupCreateInput | Prisma.PermissionSubGroupCreateInput[];
    push?: Prisma.PermissionSubGroupCreateInput | Prisma.PermissionSubGroupCreateInput[];
    updateMany?: Prisma.PermissionSubGroupUpdateManyInput;
    deleteMany?: Prisma.PermissionSubGroupDeleteManyInput;
};
export type PermissionSubGroupWhereInput = {
    AND?: Prisma.PermissionSubGroupWhereInput | Prisma.PermissionSubGroupWhereInput[];
    OR?: Prisma.PermissionSubGroupWhereInput[];
    NOT?: Prisma.PermissionSubGroupWhereInput | Prisma.PermissionSubGroupWhereInput[];
    name?: Prisma.StringFilter<"PermissionSubGroup"> | string;
    permissions?: Prisma.PermissionCompositeListFilter | Prisma.PermissionObjectEqualityInput[];
};
export type PermissionSubGroupUpdateManyInput = {
    where: Prisma.PermissionSubGroupWhereInput;
    data: Prisma.PermissionSubGroupUpdateInput;
};
export type PermissionSubGroupDeleteManyInput = {
    where: Prisma.PermissionSubGroupWhereInput;
};
export type PermissionSubGroupUpdateInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    permissions?: Prisma.XOR<Prisma.PermissionListUpdateEnvelopeInput, Prisma.PermissionCreateInput> | Prisma.PermissionCreateInput[];
};
export type PermissionSubGroupSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    name?: boolean;
    permissions?: boolean | Prisma.PermissionDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["permissionSubGroup"]>;
export type PermissionSubGroupSelectScalar = {
    name?: boolean;
};
export type PermissionSubGroupOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"name" | "permissions", ExtArgs["result"]["permissionSubGroup"]>;
export type PermissionSubGroupInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $PermissionSubGroupPayload = {
    name: "PermissionSubGroup";
    objects: {};
    scalars: {
        name: string;
    };
    composites: {
        permissions: Prisma.$PermissionPayload[];
    };
};
export type PermissionSubGroupGetPayload<S extends boolean | null | undefined | PermissionSubGroupDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PermissionSubGroupPayload, S>;
export interface PermissionSubGroupFieldRefs {
    readonly name: Prisma.FieldRef<"PermissionSubGroup", 'String'>;
}
export type PermissionSubGroupDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PermissionSubGroupSelect<ExtArgs> | null;
    omit?: Prisma.PermissionSubGroupOmit<ExtArgs> | null;
    include?: Prisma.PermissionSubGroupInclude<ExtArgs> | null;
};
