import { defineBddConfig } from 'playwright-bdd'
import { defineConfig } from '@playwright/test'

const testDir = defineBddConfig({
  features: './features/**/*.feature',
  steps: './features/steps/**/*.ts',
})

export default defineConfig({
  testDir,
  use: { baseURL: process.env.APP_URL || 'http://localhost:5173' },
  expect: { timeout: 3_000 },
})
