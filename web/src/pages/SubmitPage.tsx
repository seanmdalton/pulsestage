import { useState, useEffect, useRef } from 'react'
import { apiClient, type TenantSettingsType } from '../lib/api'
import type { Question } from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'
import { SearchResults } from '../components/SearchResults'
import { useTeamFromUrl } from '../hooks/useTeamFromUrl'
import { setFormattedPageTitle } from '../utils/titleUtils'
import { TeamContextBar } from '../components/TeamContextBar'

export function SubmitPage() {
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [searchResults, setSearchResults] = useState<Question[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [upvoteStatus, setUpvoteStatus] = useState<
    Map<string, { hasUpvoted: boolean; canUpvote: boolean }>
  >(new Map())
  const [settings, setSettings] = useState<TenantSettingsType | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const questionAtSubmit = useRef<string>('')

  const { currentTeam } = useTeamFromUrl()
  const debouncedQuestion = useDebounce(question, 300) // 300ms delay

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'submit')
  }, [currentTeam?.slug])

  // Load tenant settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const tenantSettings = await apiClient.getTenantSettings()
        setSettings(tenantSettings.settings)
      } catch (error) {
        console.error('Failed to load tenant settings:', error)
        // Use defaults if loading fails
        setSettings({
          questions: { minLength: 10, maxLength: 2000 },
          users: { defaultRole: 'member' },
          security: {
            sessionTimeout: 8,
            adminSessionTimeout: 8,
            rateLimits: {
              questionsPerHour: 10,
              upvotesPerMinute: 20,
              responsesPerHour: 5,
              searchPerMinute: 30,
            },
          },
          branding: {
            theme: 'refined-teal',
            primaryColor: '#3B82F6',
            accentColor: '#10B981',
            logoUrl: null,
            faviconUrl: null,
          },
          features: {
            allowAnonymousQuestions: true,
            requireQuestionApproval: false,
            enableEmailNotifications: false,
          },
        })
      }
    }
    loadSettings()
  }, [])

  // Search for similar questions when user types
  useEffect(() => {
    const searchQuestions = async () => {
      if (!debouncedQuestion || debouncedQuestion.trim().length < 2) {
        setSearchResults([])
        return
      }

      setSearchLoading(true)
      try {
        const results = await apiClient.searchQuestions(
          debouncedQuestion,
          currentTeam?.id
        )
        setSearchResults(results)

        // Load upvote status for search results
        const statusMap = new Map<
          string,
          { hasUpvoted: boolean; canUpvote: boolean }
        >()
        for (const question of results) {
          try {
            const status = await apiClient.getUpvoteStatus(question.id)
            statusMap.set(question.id, status)
          } catch (err) {
            console.error(
              `Failed to load upvote status for question ${question.id}:`,
              err
            )
            statusMap.set(question.id, { hasUpvoted: false, canUpvote: true })
          }
        }
        setUpvoteStatus(statusMap)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    searchQuestions()
  }, [debouncedQuestion, currentTeam?.id])

  const handleUpvote = async (questionId: string) => {
    const status = upvoteStatus.get(questionId)
    if (!status || status.hasUpvoted || !status.canUpvote) return

    try {
      const updatedQuestion = await apiClient.upvoteQuestion(questionId)

      // Update the search results
      setSearchResults((prev) =>
        prev.map((q) => (q.id === questionId ? updatedQuestion : q))
      )

      // Update upvote status
      setUpvoteStatus((prev) => {
        const newMap = new Map(prev)
        newMap.set(questionId, { hasUpvoted: true, canUpvote: false })
        return newMap
      })
    } catch (err) {
      console.error('Failed to upvote:', err)
      // Handle specific error cases
      if (
        err instanceof Error &&
        err.message.includes('Cannot upvote your own question')
      ) {
        alert('You cannot upvote your own question')
      } else if (
        err instanceof Error &&
        err.message.includes('Already upvoted')
      ) {
        alert('You have already upvoted this question')
      }
    }
  }

  // Clear validation error when user starts typing after a failed submit
  useEffect(() => {
    if (hasAttemptedSubmit && question !== questionAtSubmit.current) {
      setValidationError(null)
      setHasAttemptedSubmit(false)
    }
  }, [question, hasAttemptedSubmit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !currentTeam || !settings) return

    setHasAttemptedSubmit(true)

    // Validate before submitting
    const trimmedLength = question.trim().length
    if (trimmedLength < settings.questions.minLength) {
      questionAtSubmit.current = question
      setValidationError(
        `Question must be at least ${settings.questions.minLength} characters (currently ${trimmedLength})`
      )
      return
    }
    if (trimmedLength > settings.questions.maxLength) {
      questionAtSubmit.current = question
      setValidationError(
        `Question must not exceed ${settings.questions.maxLength} characters (currently ${trimmedLength})`
      )
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    setValidationError(null)

    try {
      const response = await apiClient.createQuestion({
        body: question.trim(),
        teamId: currentTeam.id,
      })

      setQuestion('')
      setValidationError(null)
      setHasAttemptedSubmit(false)
      questionAtSubmit.current = ''

      // Check if question is under review (API returns a message field when flagged)
      const responseWithMessage = response as typeof response & {
        message?: string
        status?: string
      }
      if (
        responseWithMessage.status === 'UNDER_REVIEW' ||
        responseWithMessage.message?.toLowerCase().includes('under review')
      ) {
        setMessage({
          type: 'success',
          text: `⚠️ Your question is under review and will be published after moderator approval. You can check its status in your profile.`,
        })
      } else {
        setMessage({
          type: 'success',
          text: `✅ Question submitted successfully to ${currentTeam.name}!`,
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to submit question',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <TeamContextBar
        teamName={currentTeam?.name || null}
        teamSlug={currentTeam?.slug || null}
        teamDescription={
          currentTeam
            ? `Submitting to ${currentTeam.name}`
            : 'Choose a team to submit your question'
        }
        showSubmitButton={false}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 mt-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Submit a Question
            </h1>
          </div>

          {!currentTeam && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Select a Team to Submit Questions
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Please select a specific team from the team selector to
                    submit questions. Questions must be associated with a team.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Your Question
                {settings && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    ({settings.questions.minLength}-
                    {settings.questions.maxLength} characters)
                  </span>
                )}
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  currentTeam
                    ? 'Ask your question here...'
                    : 'Please select a team first to submit questions'
                }
                className={`w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  !currentTeam
                    ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600'
                    : hasAttemptedSubmit && validationError
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                }`}
                rows={6}
                maxLength={settings?.questions.maxLength || 2000}
                disabled={isSubmitting || !currentTeam}
              />
              <div className="mt-1 flex justify-between items-start">
                <div
                  className={`text-sm ${
                    hasAttemptedSubmit && validationError
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {hasAttemptedSubmit && validationError ? (
                    validationError
                  ) : (
                    <>
                      {question.trim().length}/
                      {settings?.questions.maxLength || 2000} characters
                    </>
                  )}
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="whitespace-pre-line">{message.text}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!question.trim() || isSubmitting || !currentTeam}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? 'Submitting...'
                : !currentTeam
                  ? 'Select a Team First'
                  : 'Submit Question'}
            </button>
          </form>

          {/* Search Results */}
          <SearchResults
            results={searchResults}
            loading={searchLoading}
            query={debouncedQuestion}
            onUpvote={handleUpvote}
            upvotedQuestions={new Set()}
            upvoteStatus={upvoteStatus}
          />
        </div>
      </main>
    </>
  )
}
