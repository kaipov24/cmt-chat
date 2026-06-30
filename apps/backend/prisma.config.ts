import "dotenv/config";

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  engine: 'classic',
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
