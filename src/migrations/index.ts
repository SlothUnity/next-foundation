import * as migration_20260904_104033_initial from './20260904_104033_initial';

export const migrations = [
  {
    up: migration_20260904_104033_initial.up,
    down: migration_20260904_104033_initial.down,
    name: '20260904_104033_initial',
  },
];
