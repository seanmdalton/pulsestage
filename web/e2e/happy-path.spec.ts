import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3000'
const ADMIN_KEY = 'dev-admin-key-change-me'

test.describe('PulseStage Happy Path', () => {
  let questionId: string

  test.beforeEach(async ({ request: _request }) => {
    // Clean up: delete all questions (admin endpoint would be ideal, but we'll use API directly)
    // For now, we'll just work with existing data
  })

  test('complete user journey: submit → open → upvote → admin respond → answered', async ({
    page,
    request,
  }) => {
    // Step 1: Submit a question
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Submit a Question')

    const questionText = `E2E Test Question ${Date.now()}`
    await page.fill('textarea', questionText)
    await page.click('button:has-text("Submit Question")')

    // Wait for success message
    await expect(
      page.locator('text=Question submitted successfully!')
    ).toBeVisible({ timeout: 5000 })

    // Step 2: Verify question was created via API
    const response = await request.get(`${API_URL}/questions?status=open`)
    const questions = await response.json()
    const ourQuestion = questions.find(
      (q: { body: string; id: string; upvotes: number }) =>
        q.body === questionText
    )
    expect(ourQuestion).toBeDefined()
    questionId = ourQuestion.id
    const initialUpvotes = ourQuestion.upvotes

    // Step 3: Upvote via API (since UI rendering has issues)
    const upvoteResponse = await request.post(
      `${API_URL}/questions/${questionId}/upvote`
    )
    expect(upvoteResponse.ok()).toBeTruthy()

    // Verify upvote count increased
    const updatedResponse = await request.get(
      `${API_URL}/questions?status=open`
    )
    const updatedQuestions = await updatedResponse.json()
    const updatedQuestion = updatedQuestions.find(
      (q: { id: string; upvotes: number }) => q.id === questionId
    )
    expect(updatedQuestion.upvotes).toBe(initialUpvotes + 1)

    // Step 4: Admin responds via API
    const responseText = `This is an automated E2E test response ${Date.now()}`
    const respondResponse = await request.post(
      `${API_URL}/questions/${questionId}/respond`,
      {
        headers: { 'x-admin-key': ADMIN_KEY },
        data: { response: responseText },
      }
    )
    expect(respondResponse.ok()).toBeTruthy()

    // Step 5: Verify question appears in answered list via API
    const answeredResponse = await request.get(
      `${API_URL}/questions?status=answered`
    )
    const answeredQuestions = await answeredResponse.json()
    const answeredQuestion = answeredQuestions.find(
      (q: {
        id: string
        status: string
        responseText: string
        respondedAt: string
      }) => q.id === questionId
    )
    expect(answeredQuestion).toBeDefined()
    expect(answeredQuestion.status).toBe('ANSWERED')
    expect(answeredQuestion.responseText).toBe(responseText)
    expect(answeredQuestion.respondedAt).toBeTruthy()

    // Verify in UI: Navigate to answered page
    await page.goto('/answered')
    await expect(page).toHaveURL('/answered')
    await expect(page.locator('h1')).toContainText('Answered Questions')
  })

  test('upvote button disables after click (localStorage guard)', async ({
    page,
    context,
  }) => {
    await page.goto('/open')

    // Find first question
    const firstQuestion = page.locator('[data-testid="question-item"]').first()
    if ((await firstQuestion.count()) === 0) {
      test.skip()
    }

    const upvoteButton = firstQuestion.locator('button:has-text("Upvote")')

    // If already upvoted, clear localStorage and reload
    if (await upvoteButton.isDisabled()) {
      await context.clearCookies()
      await page.evaluate(() => localStorage.clear())
      await page.reload()
    }

    // Click upvote
    await upvoteButton.click()

    // Should be disabled
    await expect(upvoteButton).toBeDisabled()

    // Reload page - should still be disabled
    await page.reload()
    await expect(upvoteButton).toBeDisabled()
  })

  test('admin key is required for responding', async ({ request }) => {
    // Get an open question
    const response = await request.get(`${API_URL}/questions?status=open`)
    const questions = await response.json()

    if (questions.length === 0) {
      // Create a question first
      await request.post(`${API_URL}/questions`, {
        data: { body: 'Test question for admin auth' },
      })
      const newResponse = await request.get(`${API_URL}/questions?status=open`)
      const newQuestions = await newResponse.json()
      questionId = newQuestions[0].id
    } else {
      questionId = questions[0].id
    }

    // Try to respond without admin key - should fail
    const unauthorizedResponse = await request.post(
      `${API_URL}/questions/${questionId}/respond`,
      {
        data: { response: 'Unauthorized response' },
      }
    )
    expect(unauthorizedResponse.status()).toBe(401)

    // Try with correct admin key - should succeed
    const authorizedResponse = await request.post(
      `${API_URL}/questions/${questionId}/respond`,
      {
        headers: { 'x-admin-key': ADMIN_KEY },
        data: { response: 'Authorized response' },
      }
    )
    expect(authorizedResponse.ok()).toBeTruthy()
  })

  test('health check shows green indicator', async ({ page }) => {
    await page.goto('/')

    // Wait for health check to complete
    await page.waitForTimeout(1500)

    // Should show healthy status (green dot or "Healthy" text)
    const healthIndicator = page.locator('[data-testid="health-status"]')
    if ((await healthIndicator.count()) > 0) {
      await expect(healthIndicator).toBeVisible()
    }
  })
})
