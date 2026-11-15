import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5174);
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure', channel: process.env.PLAYWRIGHT_CHANNEL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: `npm run dev -- --host 127.0.0.1 --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.CI },
});
