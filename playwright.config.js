import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({
  path: ".env.e2e",
  override: false,
});

const frontendUrl =
  process.env.E2E_FRONTEND_URL ||
  "http://localhost:5173";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

export default defineConfig({
  testDir: "./e2e",

  timeout: 30_000,

  expect: {
    timeout: 8_000,
  },

  fullyParallel: false,
  workers: 1,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  // workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", {
      outputFolder: "playwright-report",
      open: "never",
    }],
  ],

  use: {
    baseURL: frontendUrl,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "teacher-auth-setup",
      testMatch: /auth\/teacher\.setup\.js/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "student-auth-setup",
      testMatch: /auth\/student\.setup\.js/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "teacher-chromium",
      testMatch: /teacher\/.*\.spec\.js/,
      dependencies: [
        "teacher-auth-setup",
        "student-auth-setup",
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState:
          "playwright/.auth/teacher.json",
      },
    },

    {
      name: "student-chromium",
      testMatch: /student\/.*\.spec\.js/,
      dependencies: [
        "student-auth-setup",
        "teacher-auth-setup",
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState:
          "playwright/.auth/student.json",
      },
    },

    {
      name: "unauthenticated-chromium",
      testMatch:
        /auth\/teacher-login\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: {
          cookies: [],
          origins: [],
        },
      },
    },
  ],

  webServer: [
    {
      command: "npm run start:e2e",
      cwd: "./server",
      url: `${backendUrl}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,

      env: {
        ...process.env,
        NODE_ENV: "test",
        FRONTEND_URL: frontendUrl,
        E2E_FAKE_AI_GRADING: "true",
      },
    },
    {
      command: "npm run start:e2e",
      cwd: "./client",
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,

      env: {
        ...process.env,
        VITE_API_BASE_URL:
          process.env.VITE_API_BASE_URL ||
          `${backendUrl}/api`,

        VITE_USE_MOCK: "false",
      },
    },
  ],
});