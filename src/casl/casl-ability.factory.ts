import { Injectable } from "@nestjs/common";
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";
import type { Permission } from "generated/prisma/client";

import { ACTIONS, SUBJECTS } from "./casl.types";
import type { Actions, Subjects } from "./casl.types";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

const ALLOWED_ACTIONS = ACTIONS;
const ALLOWED_SUBJECTS = SUBJECTS;

function isAllowedAction(a: unknown): a is Actions {
  return (
    typeof a === "string" && (ALLOWED_ACTIONS as readonly string[]).includes(a)
  );
}

function isAllowedSubject(s: unknown): s is Subjects {
  return (
    typeof s === "string" && (ALLOWED_SUBJECTS as readonly string[]).includes(s)
  );
}

@Injectable()
export class CaslAbilityFactory {
  createFor(user: {
    isSuperAdmin: boolean;
    permissions: Permission[];
  }): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.isSuperAdmin) {
      can("manage", "all");
      return build();
    }

    for (const perm of user.permissions ?? []) {
      if (!perm?.subject || !perm?.action) continue;
      if (!isAllowedAction(perm.action)) continue;
      if (!isAllowedSubject(perm.subject)) continue;

      can(perm.action, perm.subject);
    }

    return build();
  }
}
