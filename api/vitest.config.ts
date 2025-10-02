import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://app:app@localhost:5432/ama_test"
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
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
