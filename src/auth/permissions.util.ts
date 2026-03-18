export type Permission = { subject: string; action: string };

export function hasPermission(
  role: { permissions?: unknown } | null | undefined,
  subject: string,
  action: string,
): boolean {
  const perms = (role?.permissions ?? []) as Permission[];
  return perms.some((p) => p?.subject === subject && p?.action === action);
}
