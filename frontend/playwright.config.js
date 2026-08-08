import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../Evidence/PLAYWRIGHT', open: 'never' }],
    ['list']
  ],
  use: {
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    // Network logs are naturally embedded in the trace file.
    // Console logs can be captured explicitly in the tests.
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: '../Evidence/TRACE', // TRACE and VIDEOS will land here natively by playwright, we can move/rename them in teardown if needed.
});
