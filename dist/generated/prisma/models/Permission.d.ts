import type * as runtime from "@prisma/client/runtime/library";
import type * as Prisma from "../internal/prismaNamespace";
export type PermissionModel = runtime.Types.Result.DefaultSelection<Prisma.$PermissionPayload>;
export type PermissionCompositeListFilter = {
    equals?: Prisma.PermissionObjectEqualityInput[];
    every?: Prisma.PermissionWhereInput;
    some?: Prisma.PermissionWhereInput;
    none?: Prisma.PermissionWhereInput;
    isEmpty?: boolean;
    isSet?: boolean;
};
export type PermissionOrderByCompositeAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PermissionListCreateEnvelopeInput = {
    set?: Prisma.PermissionCreateInput | Prisma.PermissionCreateInput[];
};
export type PermissionListUpdateEnvelopeInput = {
    set?: Prisma.PermissionCreateInput | Prisma.PermissionCreateInput[];
    push?: Prisma.PermissionCreateInput | Prisma.PermissionCreateInput[];
    updateMany?: Prisma.PermissionUpdateManyInput;
    deleteMany?: Prisma.PermissionDeleteManyInput;
};
export type PermissionWhereInput = {
    AND?: Prisma.PermissionWhereInput | Prisma.PermissionWhereInput[];
    OR?: Prisma.PermissionWhereInput[];
    NOT?: Prisma.PermissionWhereInput | Prisma.PermissionWhereInput[];
    subject?: Prisma.StringFilter<"Permission"> | string;
    action?: Prisma.StringFilter<"Permission"> | string;
};
export type PermissionUpdateManyInput = {
    where: Prisma.PermissionWhereInput;
    data: Prisma.PermissionUpdateInput;
};
export type PermissionDeleteManyInput = {
    where: Prisma.PermissionWhereInput;
};
export type PermissionUpdateInput = {
    subject?: Prisma.StringFieldUpdateOperationsInput | string;
    action?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PermissionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    subject?: boolean;
    action?: boolean;
}, ExtArgs["result"]["permission"]>;
export type PermissionSelectScalar = {
    subject?: boolean;
    action?: boolean;
};
export type PermissionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"subject" | "action", ExtArgs["result"]["permission"]>;
export type $PermissionPayload = {
    name: "Permission";
    objects: {};
    scalars: {
        subject: string;
        action: string;
    };
    composites: {};
};
export type PermissionGetPayload<S extends boolean | null | undefined | PermissionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PermissionPayload, S>;
export interface PermissionFieldRefs {
    readonly subject: Prisma.FieldRef<"Permission", 'String'>;
    readonly action: Prisma.FieldRef<"Permission", 'String'>;
}
export type PermissionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PermissionSelect<ExtArgs> | null;
    omit?: Prisma.PermissionOmit<ExtArgs> | null;
};
