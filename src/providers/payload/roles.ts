export const userRoles = [
  {
    label: 'Administrator',
    value: 'admin',
  },
  {
    label: 'Editor',
    value: 'editor',
  },
] as const;

export type UserRole = (typeof userRoles)[number]['value'];

export const defaultUserRole: UserRole = 'editor';

export const firstUserRole: UserRole = 'admin';
