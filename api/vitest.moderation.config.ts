import { defineConfig } from 'vitest/config';

// Moderation tests don't need database setup
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/moderation/**/*.test.ts'],
    // No setup files - moderation tests are standalone
    setupFiles: [],
  },
});
