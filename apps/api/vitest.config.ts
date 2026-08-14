import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
    // Increase timeout because buildApp() loads all plugins
    testTimeout: 30000,
  },
});
