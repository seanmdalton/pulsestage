import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://app:app@localhost:5432/ama_test",
      ADMIN_KEY: "test-admin-key"
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 45,
        branches: 65,
        functions: 75,
        statements: 45
      },
      exclude: [
        "src/**/*.test.ts",
        "src/server.ts",
        "dist/**",
        "node_modules/**"
      ]
    },
    setupFiles: ["./src/test/setup.ts"]
  }
});
