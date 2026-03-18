export const ACTIONS = [
  "manage",
  "create",
  "read",
  "update",
  "delete",
  "copy",
] as const;

export type Actions = (typeof ACTIONS)[number];

export const SUBJECTS = [
  "all",
  "User",
  "Role",
  "Group",
  "Subgroup",
  "Contact",
  "Email",
  "PluginConfig",
  "Export",
  "EmailAddressTemplate",
  "Todo",
  "PluginParam",
  "PermissionGroup",
] as const;

export type Subjects = (typeof SUBJECTS)[number];
