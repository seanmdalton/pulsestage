import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '../lib/api'
import type { Question } from '../lib/api'
import { QuestionModal } from '../components/QuestionModal'
import { AnswerModal } from '../components/AnswerModal'
import {
  QuestionFilters,
  type FilterState,
} from '../components/QuestionFilters'
import { useTeamFromUrl } from '../hooks/useTeamFromUrl'
import { setFormattedPageTitle } from '../utils/titleUtils'
import { useSSE } from '../hooks/useSSE'
import type { SSEEvent } from '../hooks/useSSE'
import { TeamContextBar } from '../components/TeamContextBar'
import { useTheme } from '../contexts/ThemeContext'
import { groupQuestionsByWeek } from '../utils/dateUtils'
import { useUser } from '../contexts/UserContext'

type TabView = 'open' | 'answered' | 'all'

export function QuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('view') as TabView) || 'open'

  const [activeTab, setActiveTab] = useState<TabView>(initialTab)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upvoteStatus, setUpvoteStatus] = useState<
    Map<string, { hasUpvoted: boolean; canUpvote: boolean }>
  >(new Map())
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})
  const [isPresenting, setIsPresenting] = useState(false)
  const [questionCounts, setQuestionCounts] = useState({
    open: 0,
    answered: 0,
    all: 0,
  })

  const { currentTeam } = useTeamFromUrl()
  const { theme, colorMode } = useTheme()
  const themeColors = colorMode === 'light' ? theme.light : theme.dark
  const navigate = useNavigate()
  const { getUserRoleInTeam, userTeams } = useUser()

  // Check if user can access presentation mode (admin or moderator)
  // For "All Teams" view, check if user is admin/moderator in ANY team
  const canPresent = currentTeam
    ? ['admin', 'moderator'].includes(getUserRoleInTeam(currentTeam.id) || '')
    : userTeams.some((team) =>
        ['admin', 'moderator'].includes(team.userRole || '')
      )

  // Debug logging for presentation button visibility
  useEffect(() => {
    console.log('Presentation button visibility check:', {
      canPresent,
      isPresenting,
      activeTab,
      questionCount: questions.length,
      currentTeam: currentTeam?.slug || 'all',
      userTeams: userTeams.map((t) => ({ name: t.name, role: t.userRole })),
      shouldShow:
        !isPresenting &&
        canPresent &&
        activeTab === 'open' &&
        questions.length > 0,
    })
  }, [
    canPresent,
    isPresenting,
    activeTab,
    questions.length,
    currentTeam,
    userTeams,
  ])

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'questions')
  }, [currentTeam?.slug])

  // Update URL when tab changes
  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab)
    setSearchParams({ view: tab })
  }

  // Handle SSE events for real-time updates
  const handleSSEEvent = async (event: SSEEvent) => {
    if (
      event.type === 'question:created' ||
      event.type === 'question:upvoted' ||
      event.type === 'question:tagged' ||
      event.type === 'question:untagged' ||
      event.type === 'question:answered'
    ) {
      const updatedQuestion = event.data as Question

      // Update questions based on active tab
      const matchesTeamFilter =
        !currentTeam || updatedQuestion.teamId === currentTeam.id

      if (matchesTeamFilter) {
        setQuestions((prev) => {
          const existingIndex = prev.findIndex(
            (q) => q.id === updatedQuestion.id
          )

          if (existingIndex >= 0) {
            const newQuestions = [...prev]
            newQuestions[existingIndex] = updatedQuestion
            return newQuestions.sort((a, b) => b.upvotes - a.upvotes)
          } else if (
            (activeTab === 'open' && updatedQuestion.status === 'OPEN') ||
            (activeTab === 'answered' &&
              updatedQuestion.status === 'ANSWERED') ||
            activeTab === 'all'
          ) {
            return [updatedQuestion, ...prev].sort(
              (a, b) => b.upvotes - a.upvotes
            )
          }
          return prev
        })
      }
    }

    if (event.type === 'presentation:started') {
      setIsPresenting(true)
    } else if (event.type === 'presentation:stopped') {
      setIsPresenting(false)
    }
  }

  useSSE({ onEvent: handleSSEEvent })

  // Load question counts for tabs (independent of active tab)
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [openData, answeredData] = await Promise.all([
          apiClient.getQuestions('OPEN', currentTeam?.id),
          apiClient.getQuestions('ANSWERED', currentTeam?.id),
        ])
        setQuestionCounts({
          open: openData.length,
          answered: answeredData.length,
          all: openData.length + answeredData.length,
        })
      } catch (err) {
        console.error('Error loading question counts:', err)
      }
    }
    loadCounts()
  }, [currentTeam?.id])

  // Load questions based on active tab
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Loading questions:', {
          activeTab,
          teamId: currentTeam?.id,
          filters,
        })

        let data: Question[]

        if (activeTab === 'all') {
          const [openData, answeredData] = await Promise.all([
            apiClient.getQuestions('OPEN', currentTeam?.id, filters),
            apiClient.getQuestions('ANSWERED', currentTeam?.id, filters),
          ])
          data = [...openData, ...answeredData].sort(
            (a, b) => b.upvotes - a.upvotes
          )
        } else {
          const status = activeTab === 'open' ? 'OPEN' : 'ANSWERED'
          data = await apiClient.getQuestions(status, currentTeam?.id, filters)
        }

        console.log('Questions loaded:', data.length)
        setQuestions(data)

        // Load upvote status for open questions
        if (activeTab === 'open' || activeTab === 'all') {
          const statusMap = new Map()
          await Promise.all(
            data
              .filter((q) => q.status === 'OPEN')
              .map(async (question) => {
                try {
                  const status = await apiClient.getUpvoteStatus(question.id)
                  statusMap.set(question.id, status)
                } catch (err) {
                  console.error(
                    `Failed to load upvote status for ${question.id}:`,
                    err
                  )
                }
              })
          )
          setUpvoteStatus(statusMap)
        }
      } catch (err) {
        console.error('Error loading questions:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load questions'
        )
      } finally {
        console.log('Loading complete, setting loading to false')
        setLoading(false)
      }
    }

    loadQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentTeam?.id, JSON.stringify(filters)])

  const handleUpvote = async (questionId: string) => {
    try {
      const status = upvoteStatus.get(questionId)
      if (!status) return

      if (status.hasUpvoted) {
        // For now, just call upvote again (API will handle toggle)
        await apiClient.upvoteQuestion(questionId)
      } else {
        if (!status.canUpvote) {
          alert('You have reached your daily upvote limit (10 upvotes per day)')
          return
        }
        await apiClient.upvoteQuestion(questionId)
      }

      // Update upvote status immediately for visual feedback
      setUpvoteStatus((prev) => {
        const newMap = new Map(prev)
        newMap.set(questionId, {
          hasUpvoted: true,
          canUpvote: status.canUpvote,
        })
        return newMap
      })

      // Refresh questions to get updated upvote counts
      const updatedQuestions = await apiClient.getQuestions(
        activeTab === 'answered' ? 'ANSWERED' : 'OPEN',
        currentTeam?.id,
        filters
      )
      setQuestions(updatedQuestions)
    } catch (err) {
      console.error('Upvote error:', err)
      alert(err instanceof Error ? err.message : 'Failed to upvote')
    }
  }

  // Use the pre-loaded counts instead of filtering current questions
  const openQuestionCount = questionCounts.open
  const answeredQuestionCount = questionCounts.answered
  const allQuestionCount = questionCounts.all

  // Group answered questions by week for answered tab
  const groupedQuestions =
    activeTab === 'answered' ? groupQuestionsByWeek(questions) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TeamContextBar
        teamName={currentTeam?.name || null}
        teamSlug={currentTeam?.slug || null}
        teamDescription={currentTeam?.description}
        showSubmitButton={false}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Questions
          </h1>

          {/* Action Bar - Unified controls */}
          <div className="flex items-center gap-2 mb-6 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Left: Moderator Tools */}
            <div className="flex items-center gap-1.5">
              {/* Presenting Badge */}
              {isPresenting && (
                <button
                  onClick={() =>
                    navigate(`/${currentTeam?.slug || 'all'}/open/present`)
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
                  title="Currently Presenting - Click to return"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-100"></span>
                  </span>
                  Live
                </button>
              )}
              {/* Presentation Mode Icon Button */}
              {!isPresenting &&
                canPresent &&
                activeTab === 'open' &&
                questions.length > 0 && (
                  <button
                    onClick={() =>
                      navigate(`/${currentTeam?.slug || 'all'}/open/present`)
                    }
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Start Presentation Mode"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                )}
            </div>

            {/* Separator */}
            {(isPresenting ||
              (!isPresenting &&
                canPresent &&
                activeTab === 'open' &&
                questions.length > 0)) && (
              <div className="h-5 w-px bg-gray-300 dark:bg-gray-600"></div>
            )}

            {/* Center: Search & Filters */}
            <QuestionFilters
              currentFilters={filters}
              onFilterChange={setFilters}
            />

            {/* Right: Primary Action */}
            <button
              onClick={() => navigate(`/${currentTeam?.slug || 'all'}`)}
              style={{ backgroundColor: themeColors.primary }}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-sm transition-all hover:shadow-md flex-shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Submit Question
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('open')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'open'
                    ? ''
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={
                  activeTab === 'open'
                    ? {
                        borderBottomColor: themeColors.primary,
                        color: themeColors.primary,
                      }
                    : { borderBottomColor: 'transparent' }
                }
              >
                Open ({openQuestionCount})
              </button>
              <button
                onClick={() => handleTabChange('answered')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'answered'
                    ? ''
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={
                  activeTab === 'answered'
                    ? {
                        borderBottomColor: themeColors.primary,
                        color: themeColors.primary,
                      }
                    : { borderBottomColor: 'transparent' }
                }
              >
                Answered ({answeredQuestionCount})
              </button>
              <button
                onClick={() => handleTabChange('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? ''
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={
                  activeTab === 'all'
                    ? {
                        borderBottomColor: themeColors.primary,
                        color: themeColors.primary,
                      }
                    : { borderBottomColor: 'transparent' }
                }
              >
                All ({allQuestionCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Questions List */}
        {activeTab === 'answered' && groupedQuestions ? (
          // Grouped view for answered questions
          <div className="space-y-8">
            {groupedQuestions.map((group) => (
              <div key={group.weekLabel}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {group.weekLabel}
                </h3>
                <div className="space-y-4">
                  {group.questions.map((question) => (
                    <div
                      key={question.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedQuestion(question)
                        setIsModalOpen(true)
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="text-base text-gray-900 dark:text-gray-100 font-medium">
                            {question.body}
                          </p>
                          {question.responseText && (
                            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-4 py-2">
                              <span className="font-semibold">Answer:</span>{' '}
                              {question.responseText}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="text-orange-500">▲</span>
                              {question.upvotes}
                            </span>
                            {question.team && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                                {question.team.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular list for open/all questions
          <div className="space-y-4">
            {questions.map((question) => {
              const status = upvoteStatus.get(question.id)
              const isOpen = question.status === 'OPEN'

              return (
                <div
                  key={question.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Upvote Button (only for open questions) */}
                    {isOpen && status && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpvote(question.id)
                        }}
                        disabled={!status.canUpvote && !status.hasUpvoted}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-lg transition-all ${
                          status.hasUpvoted
                            ? 'bg-orange-500 dark:bg-orange-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                        }`}
                        title={
                          status.hasUpvoted
                            ? 'You upvoted this'
                            : 'Upvote this question'
                        }
                      >
                        <span className="text-xl">
                          {status.hasUpvoted ? '▲' : '△'}
                        </span>
                        <span className="text-sm font-semibold">
                          {question.upvotes}
                        </span>
                      </button>
                    )}
                    {!isOpen && (
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        <span className="text-xl">▲</span>
                        <span className="text-sm font-semibold">
                          {question.upvotes}
                        </span>
                      </div>
                    )}

                    {/* Question Content */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedQuestion(question)
                        setIsModalOpen(true)
                      }}
                    >
                      <p className="text-base text-gray-900 dark:text-gray-100 font-medium">
                        {question.body}
                      </p>
                      {question.responseText && (
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-4 py-2">
                          <span className="font-semibold">Answer:</span>{' '}
                          {question.responseText}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {question.status === 'ANSWERED' && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">
                            Answered
                          </span>
                        )}
                        {question.team && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                            {question.team.name}
                          </span>
                        )}
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex gap-2">
                            {question.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs"
                              >
                                {tag.tag?.name || 'Tag'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No {activeTab} questions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'open' && 'Be the first to ask a question!'}
              {activeTab === 'answered' &&
                'No questions have been answered yet.'}
              {activeTab === 'all' &&
                'No questions yet. Start the conversation!'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedQuestion && selectedQuestion.status === 'OPEN' && (
        <QuestionModal
          question={selectedQuestion}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedQuestion(null)
          }}
          onUpvote={handleUpvote}
          upvotedQuestions={
            new Set(
              Array.from(upvoteStatus.entries())
                .filter(([, status]) => status.hasUpvoted)
                .map(([id]) => id)
            )
          }
        />
      )}
      {selectedQuestion && selectedQuestion.status === 'ANSWERED' && (
        <AnswerModal
          question={selectedQuestion}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedQuestion(null)
          }}
        />
      )}
    </div>
  )
}
