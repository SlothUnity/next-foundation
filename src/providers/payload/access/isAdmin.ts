import type { Access, FieldAccess } from 'payload';

import { hasRole } from './hasRole';

export const isAdmin: Access = ({ req }) => hasRole(req.user, 'admin');

export const isAdminField: FieldAccess = ({ req }) => hasRole(req.user, 'admin');
