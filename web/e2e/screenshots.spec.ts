/**
 * Screenshot Capture Script for README
 *
 * This script automatically captures all key views of PulseStage
 * Run with: npm run test:e2e -- screenshots.spec.ts --headed
 */

import { test, expect } from '@playwright/test'

// Configure for screenshot capture
test.use({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2, // Retina quality
})

const DEMO_USER = 'User (Demo)' // Display name in dropdown
const ADMIN_USER = 'Admin (Demo)' // Display name in dropdown
const BASE_URL = 'http://localhost:5173'

// Helper function to login
async function loginAs(page: any, userLabel: string) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('select', { timeout: 10000 })
  await page.selectOption('select', { label: userLabel })
  await page.click('button:has-text("Continue as")')
  await page.waitForLoadState('networkidle')
}

test.describe('PulseStage Screenshots for README', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto(BASE_URL)
  })

  test('01 - Login / Demo Mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Wait for auth selector to load
    await page.waitForSelector('text=Try Demo', { timeout: 10000 })
    await page.waitForTimeout(500) // Let UI settle

    await page.screenshot({
      path: 'screenshots/01-login-demo.png',
      fullPage: true,
    })
  })

  test('02 - Open Questions (Main View)', async ({ page }) => {
    // Login as demo user
    await loginAs(page, DEMO_USER)

    // Wait for questions to load
    await page.waitForSelector('text=Open Questions', { timeout: 10000 })
    await page.waitForTimeout(1000) // Let data settle

    await page.screenshot({
      path: 'screenshots/02-open-questions.png',
      fullPage: true,
    })
  })

  test('03 - Submit Question', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Navigate to submit
    await page.goto(`${BASE_URL}/submit`)
    await page.waitForSelector('textarea', { timeout: 5000 })

    await page.screenshot({
      path: 'screenshots/03-submit-question.png',
      fullPage: true,
    })
  })

  test('04 - Question Detail (Answered)', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Go to answered questions
    await page.goto(`${BASE_URL}/answered`)
    await page.waitForTimeout(1000)

    // Click first answered question
    const firstQuestion = page.locator('article').first()
    if (await firstQuestion.isVisible()) {
      await firstQuestion.click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: 'screenshots/04-question-detail-answered.png',
        fullPage: true,
      })
    }
  })

  test('05 - Moderator Dashboard', async ({ page }) => {
    // Login as admin
    await loginAs(page, ADMIN_USER)

    // Navigate to moderator dashboard
    await page.goto(`${BASE_URL}/moderator`)
    await page.waitForSelector('text=Moderator Dashboard', { timeout: 5000 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/05-moderator-dashboard.png',
      fullPage: true,
    })
  })

  test('06 - Moderation Queue', async ({ page }) => {
    // Login as admin
    await loginAs(page, ADMIN_USER)

    // Navigate to moderation queue
    await page.goto(`${BASE_URL}/moderation-queue`)
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/06-moderation-queue.png',
      fullPage: true,
    })
  })

  test('07 - Answered Timeline', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Navigate to answered
    await page.goto(`${BASE_URL}/answered`)
    await page.waitForSelector('text=Answered Questions', { timeout: 5000 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/07-answered-timeline.png',
      fullPage: true,
    })
  })

  test('08 - Admin Panel', async ({ page }) => {
    // Login as admin
    await loginAs(page, ADMIN_USER)

    // Navigate to admin
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForSelector('text=Admin Panel', { timeout: 5000 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/08-admin-panel.png',
      fullPage: true,
    })
  })

  test('09 - Tag Management', async ({ page }) => {
    // Login as admin
    await loginAs(page, ADMIN_USER)

    // Navigate to admin and tags tab
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForTimeout(500)

    // Click Tags tab
    const tagsTab = page.locator('button:has-text("Tags")')
    if (await tagsTab.isVisible()) {
      await tagsTab.click()
      await page.waitForTimeout(500)
    }

    await page.screenshot({
      path: 'screenshots/09-tag-management.png',
      fullPage: true,
    })
  })

  test('10 - Team Management', async ({ page }) => {
    // Login as admin
    await loginAs(page, ADMIN_USER)

    // Navigate to admin and teams tab
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForTimeout(500)

    // Click Teams tab
    const teamsTab = page.locator('button:has-text("Teams")')
    if (await teamsTab.isVisible()) {
      await teamsTab.click()
      await page.waitForTimeout(500)
    }

    await page.screenshot({
      path: 'screenshots/10-team-management.png',
      fullPage: true,
    })
  })

  test('11 - User Profile', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Navigate to profile
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/11-user-profile.png',
      fullPage: true,
    })
  })

  test('12 - Presentation Mode', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Navigate to presentation mode
    await page.goto(`${BASE_URL}/presentation`)
    await page.waitForTimeout(2000) // Let it load fully

    await page.screenshot({
      path: 'screenshots/12-presentation-mode.png',
      fullPage: false, // Capture visible area only for presentation
    })
  })

  test('13 - Search Results', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Wait for main page
    await page.waitForSelector('input[placeholder*="Search"]', {
      timeout: 5000,
    })

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'roadmap')
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/13-search-results.png',
      fullPage: true,
    })
  })

  test('14 - Dark Mode', async ({ page }) => {
    // Login
    await loginAs(page, DEMO_USER)

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Toggle dark mode
    const darkModeToggle = page.locator(
      'button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀")'
    )
    if (await darkModeToggle.first().isVisible()) {
      await darkModeToggle.first().click()
      await page.waitForTimeout(500)
    }

    await page.screenshot({
      path: 'screenshots/14-dark-mode.png',
      fullPage: true,
    })
  })

  test('15 - Mobile View', async ({ page, context }) => {
    // Set mobile viewport
    await context.setViewportSize({ width: 375, height: 812 }) // iPhone X

    // Login
    await loginAs(page, DEMO_USER)

    // Wait for questions
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/15-mobile-view.png',
      fullPage: true,
    })
  })
})

test.describe('Additional Context Screenshots', () => {
  test('16 - Demo Banner', async ({ page }) => {
    // Show the demo mode banner
    await loginAs(page, DEMO_USER)

    // Make sure demo banner is visible
    await page.waitForSelector('text=Demo Mode', { timeout: 5000 })

    await page.screenshot({
      path: 'screenshots/16-demo-banner.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 200 }, // Just the banner area
    })
  })

  test('17 - Moderation Stats', async ({ page }) => {
    // Login as admin
    await loginAs(page, ADMIN_USER)

    // Navigate to moderation stats
    await page.goto(`${BASE_URL}/admin/moderation-stats`)
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'screenshots/17-moderation-stats.png',
      fullPage: true,
    })
  })
})
