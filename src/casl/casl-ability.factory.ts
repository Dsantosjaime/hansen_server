/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import type { Permission } from 'generated/prisma/client';

export type Actions =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'copy';
export type Subjects = 'all' | 'Post' | 'User' | 'Role';
export type AppAbility = MongoAbility<[Actions, Subjects]>;

const ALLOWED_ACTIONS: Actions[] = [
  'manage',
  'create',
  'read',
  'update',
  'delete',
  'copy',
];
const ALLOWED_SUBJECTS: Subjects[] = ['all', 'Post', 'User', 'Role'];

function isAllowedAction(a: string): a is Actions {
  return ALLOWED_ACTIONS.includes(a as Actions);
}
function isAllowedSubject(s: string): s is Subjects {
  return ALLOWED_SUBJECTS.includes(s as Subjects);
}

@Injectable()
export class CaslAbilityFactory {
  createFor(user: {
    isSuperAdmin: boolean;
    permissions: Permission[];
  }): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.isSuperAdmin) {
      can('manage', 'all');
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
