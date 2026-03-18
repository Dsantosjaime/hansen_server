import { MongoAbility } from "@casl/ability";
import type { Permission } from "generated/prisma/client";
import type { Actions, Subjects } from "./casl.types";
export type AppAbility = MongoAbility<[Actions, Subjects]>;
export declare class CaslAbilityFactory {
    createFor(user: {
        isSuperAdmin: boolean;
        permissions: Permission[];
    }): AppAbility;
}
