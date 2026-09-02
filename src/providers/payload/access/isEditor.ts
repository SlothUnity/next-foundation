import type { Access } from 'payload';

import { hasRole } from './hasRole';

export const isEditor: Access = ({ req }) =>
  hasRole(req.user, 'admin') || hasRole(req.user, 'editor');
