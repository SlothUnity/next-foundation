import type { UserRole } from '@/providers/payload/roles';

interface RoleBearer {
  roles?: unknown;
}

export function hasRole(user: RoleBearer | null | undefined, role: UserRole): boolean {
  const roles = user?.roles;

  return Array.isArray(roles) && roles.includes(role);
}
