import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { BASE } from '../base'

const { Given, Then } = createBdd()

Given('new account', async ({ page }) => {
  await page.goto(BASE + '/')
  await page.locator('#iam.email-tab').click()
  await expect(page.locator('#iam.username-input')).toBeFocused()
  await page.keyboard.type(faker.internet.email())
  await page.keyboard.press('Tab')
  await page.keyboard.type(faker.internet.password())
  await page.keyboard.press('Enter')

  await expect(async () => {
    const challenge = await page.evaluate(() => localStorage.getItem('auth:challenge'))

    expect(challenge).not.toBeNull()
  }).toPass()
})

Then('I am authenticated', async ({ page }) => {
  const challenge = await page.evaluate(() => localStorage.getItem('auth:challenge'))

  expect(challenge).not.toBeNull()
})

Then('I am not authenticated', async ({ page }) => {
  const challenge = await page.evaluate(() => localStorage.getItem('auth:challenge'))

  expect(challenge).toBeNull()
})
