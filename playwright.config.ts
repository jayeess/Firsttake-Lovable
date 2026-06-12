import { defineConfig, devices } from '@playwright/test';
import nextEnv from '@next/env';
import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
loadDotenv({
  path: resolve(process.cwd(), '.env.e2e.local'),
  override: false,
  quiet: true,
});
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npm run start -- --hostname 127.0.0.1 --port 3100',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
