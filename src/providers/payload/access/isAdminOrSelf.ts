import type { Access } from 'payload';

import { hasRole } from './hasRole';

export const isAdminOrSelf: Access = ({ req }) => {
  if (hasRole(req.user, 'admin')) {
    return true;
  }

  if (!req.user) {
    return false;
  }

  return {
    id: {
      equals: req.user.id,
    },
  };
};
