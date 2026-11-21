import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 15_000,
    env: {
      FIREBASE_PROJECT_ID: "demo-el-descanso",
      GCLOUD_PROJECT: "demo-el-descanso",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      NODE_ENV: "test",
    },
  },
});
