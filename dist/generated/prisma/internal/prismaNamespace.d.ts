import * as runtime from "@prisma/client/runtime/library";
import type * as Prisma from "../models";
import { type PrismaClient } from "./class";
export type * from '../models';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
export type Metrics = runtime.Metrics;
export type Metric<T> = runtime.Metric<T>;
export type MetricHistogram = runtime.MetricHistogram;
export type MetricHistogramBucket = runtime.MetricHistogramBucket;
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
export declare const prismaVersion: PrismaVersion;
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
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
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
export declare const ModelName: {
    readonly User: "User";
    readonly PermissionGroup: "PermissionGroup";
    readonly Role: "Role";
    readonly Group: "Group";
    readonly SubGroup: "SubGroup";
    readonly Contact: "Contact";
    readonly EmailSend: "EmailSend";
    readonly CampaignAttachment: "CampaignAttachment";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "user" | "permissionGroup" | "role" | "group" | "subGroup" | "contact" | "emailSend" | "campaignAttachment";
        txIsolationLevel: never;
    };
    model: {
        User: {
            payload: Prisma.$UserPayload<ExtArgs>;
            fields: Prisma.UserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findFirst: {
                    args: Prisma.UserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findMany: {
                    args: Prisma.UserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                create: {
                    args: Prisma.UserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                createMany: {
                    args: Prisma.UserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.UserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                update: {
                    args: Prisma.UserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                deleteMany: {
                    args: Prisma.UserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.UserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.UserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.UserFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.UserAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.UserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        PermissionGroup: {
            payload: Prisma.$PermissionGroupPayload<ExtArgs>;
            fields: Prisma.PermissionGroupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PermissionGroupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PermissionGroupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>;
                };
                findFirst: {
                    args: Prisma.PermissionGroupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PermissionGroupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>;
                };
                findMany: {
                    args: Prisma.PermissionGroupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>[];
                };
                create: {
                    args: Prisma.PermissionGroupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>;
                };
                createMany: {
                    args: Prisma.PermissionGroupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.PermissionGroupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>;
                };
                update: {
                    args: Prisma.PermissionGroupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>;
                };
                deleteMany: {
                    args: Prisma.PermissionGroupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PermissionGroupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.PermissionGroupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PermissionGroupPayload>;
                };
                aggregate: {
                    args: Prisma.PermissionGroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePermissionGroup>;
                };
                groupBy: {
                    args: Prisma.PermissionGroupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PermissionGroupGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.PermissionGroupFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.PermissionGroupAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.PermissionGroupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PermissionGroupCountAggregateOutputType> | number;
                };
            };
        };
        Role: {
            payload: Prisma.$RolePayload<ExtArgs>;
            fields: Prisma.RoleFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RoleFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RoleFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                findFirst: {
                    args: Prisma.RoleFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RoleFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                findMany: {
                    args: Prisma.RoleFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                create: {
                    args: Prisma.RoleCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                createMany: {
                    args: Prisma.RoleCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.RoleDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                update: {
                    args: Prisma.RoleUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                deleteMany: {
                    args: Prisma.RoleDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RoleUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.RoleUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                aggregate: {
                    args: Prisma.RoleAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRole>;
                };
                groupBy: {
                    args: Prisma.RoleGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.RoleFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.RoleAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.RoleCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleCountAggregateOutputType> | number;
                };
            };
        };
        Group: {
            payload: Prisma.$GroupPayload<ExtArgs>;
            fields: Prisma.GroupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.GroupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.GroupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                findFirst: {
                    args: Prisma.GroupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.GroupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                findMany: {
                    args: Prisma.GroupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>[];
                };
                create: {
                    args: Prisma.GroupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                createMany: {
                    args: Prisma.GroupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.GroupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                update: {
                    args: Prisma.GroupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                deleteMany: {
                    args: Prisma.GroupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.GroupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.GroupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$GroupPayload>;
                };
                aggregate: {
                    args: Prisma.GroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateGroup>;
                };
                groupBy: {
                    args: Prisma.GroupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.GroupGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.GroupFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.GroupAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.GroupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.GroupCountAggregateOutputType> | number;
                };
            };
        };
        SubGroup: {
            payload: Prisma.$SubGroupPayload<ExtArgs>;
            fields: Prisma.SubGroupFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SubGroupFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SubGroupFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>;
                };
                findFirst: {
                    args: Prisma.SubGroupFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SubGroupFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>;
                };
                findMany: {
                    args: Prisma.SubGroupFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>[];
                };
                create: {
                    args: Prisma.SubGroupCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>;
                };
                createMany: {
                    args: Prisma.SubGroupCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.SubGroupDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>;
                };
                update: {
                    args: Prisma.SubGroupUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>;
                };
                deleteMany: {
                    args: Prisma.SubGroupDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SubGroupUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.SubGroupUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubGroupPayload>;
                };
                aggregate: {
                    args: Prisma.SubGroupAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSubGroup>;
                };
                groupBy: {
                    args: Prisma.SubGroupGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubGroupGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.SubGroupFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.SubGroupAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.SubGroupCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubGroupCountAggregateOutputType> | number;
                };
            };
        };
        Contact: {
            payload: Prisma.$ContactPayload<ExtArgs>;
            fields: Prisma.ContactFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContactFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContactFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>;
                };
                findFirst: {
                    args: Prisma.ContactFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContactFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>;
                };
                findMany: {
                    args: Prisma.ContactFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>[];
                };
                create: {
                    args: Prisma.ContactCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>;
                };
                createMany: {
                    args: Prisma.ContactCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.ContactDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>;
                };
                update: {
                    args: Prisma.ContactUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>;
                };
                deleteMany: {
                    args: Prisma.ContactDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContactUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.ContactUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContactPayload>;
                };
                aggregate: {
                    args: Prisma.ContactAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContact>;
                };
                groupBy: {
                    args: Prisma.ContactGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContactGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.ContactFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.ContactAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.ContactCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContactCountAggregateOutputType> | number;
                };
            };
        };
        EmailSend: {
            payload: Prisma.$EmailSendPayload<ExtArgs>;
            fields: Prisma.EmailSendFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.EmailSendFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.EmailSendFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>;
                };
                findFirst: {
                    args: Prisma.EmailSendFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.EmailSendFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>;
                };
                findMany: {
                    args: Prisma.EmailSendFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>[];
                };
                create: {
                    args: Prisma.EmailSendCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>;
                };
                createMany: {
                    args: Prisma.EmailSendCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.EmailSendDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>;
                };
                update: {
                    args: Prisma.EmailSendUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>;
                };
                deleteMany: {
                    args: Prisma.EmailSendDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.EmailSendUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.EmailSendUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EmailSendPayload>;
                };
                aggregate: {
                    args: Prisma.EmailSendAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateEmailSend>;
                };
                groupBy: {
                    args: Prisma.EmailSendGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EmailSendGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.EmailSendFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.EmailSendAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.EmailSendCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EmailSendCountAggregateOutputType> | number;
                };
            };
        };
        CampaignAttachment: {
            payload: Prisma.$CampaignAttachmentPayload<ExtArgs>;
            fields: Prisma.CampaignAttachmentFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.CampaignAttachmentFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.CampaignAttachmentFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>;
                };
                findFirst: {
                    args: Prisma.CampaignAttachmentFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.CampaignAttachmentFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>;
                };
                findMany: {
                    args: Prisma.CampaignAttachmentFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>[];
                };
                create: {
                    args: Prisma.CampaignAttachmentCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>;
                };
                createMany: {
                    args: Prisma.CampaignAttachmentCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                delete: {
                    args: Prisma.CampaignAttachmentDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>;
                };
                update: {
                    args: Prisma.CampaignAttachmentUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>;
                };
                deleteMany: {
                    args: Prisma.CampaignAttachmentDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.CampaignAttachmentUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                upsert: {
                    args: Prisma.CampaignAttachmentUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$CampaignAttachmentPayload>;
                };
                aggregate: {
                    args: Prisma.CampaignAttachmentAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateCampaignAttachment>;
                };
                groupBy: {
                    args: Prisma.CampaignAttachmentGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CampaignAttachmentGroupByOutputType>[];
                };
                findRaw: {
                    args: Prisma.CampaignAttachmentFindRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                aggregateRaw: {
                    args: Prisma.CampaignAttachmentAggregateRawArgs<ExtArgs>;
                    result: Prisma.JsonObject;
                };
                count: {
                    args: Prisma.CampaignAttachmentCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CampaignAttachmentCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $runCommandRaw: {
                args: Prisma.InputJsonObject;
                result: JsonObject;
            };
        };
    };
};
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
export declare const CampaignAttachmentScalarFieldEnum: {
    readonly id: "id";
    readonly token: "token";
    readonly filename: "filename";
    readonly mimeType: "mimeType";
    readonly size: "size";
    readonly path: "path";
    readonly createdAt: "createdAt";
    readonly expiresAt: "expiresAt";
};
export type CampaignAttachmentScalarFieldEnum = (typeof CampaignAttachmentScalarFieldEnum)[keyof typeof CampaignAttachmentScalarFieldEnum];
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
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
export type BatchPayload = {
    count: number;
};
export type Datasource = {
    url?: string;
};
export type Datasources = {
    db?: Datasource;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export interface PrismaClientOptions {
    datasources?: Datasources;
    datasourceUrl?: string;
    errorFormat?: ErrorFormat;
    log?: (LogLevel | LogDefinition)[];
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
    };
    adapter?: runtime.SqlDriverAdapterFactory | null;
    omit?: GlobalOmitConfig;
}
export type GlobalOmitConfig = {
    user?: Prisma.UserOmit;
    permissionGroup?: Prisma.PermissionGroupOmit;
    role?: Prisma.RoleOmit;
    group?: Prisma.GroupOmit;
    subGroup?: Prisma.SubGroupOmit;
    contact?: Prisma.ContactOmit;
    emailSend?: Prisma.EmailSendOmit;
    campaignAttachment?: Prisma.CampaignAttachmentOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
