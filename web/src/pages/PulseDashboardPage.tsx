import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import { useTheme } from '../contexts/ThemeContext'
import { useTeamFromUrl } from '../hooks/useTeamFromUrl'
import { TeamContextBar } from '../components/TeamContextBar'
import { setFormattedPageTitle } from '../utils/titleUtils'

interface PulseQuestion {
  questionId: string
  questionText: string
  category: string | null
  scale: string
  overallAverage: number | null // Can be null when insufficient data
  insufficient: boolean
}

interface PulseData {
  tenantId: string
  anonThreshold: number
  summary: {
    overallTrend: Array<{
      weekStart: string
      average: number | null
      participation: number | null // Can be null when no invites
      responseCount: number
      insufficient: boolean
    }>
    participationRate: number
    totalResponses: number
    totalInvites: number
  }
  questions: PulseQuestion[]
}

type TimeRange = '4w' | '8w' | '12w'

export function PulseDashboardPage() {
  const { theme, colorMode } = useTheme()
  const themeColors = colorMode === 'light' ? theme.light : theme.dark
  const { currentTeam } = useTeamFromUrl()

  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('8w')

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'pulse')
  }, [currentTeam?.slug])

  useEffect(() => {
    loadPulseSummary()
  }, [timeRange, currentTeam?.id])

  const loadPulseSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getPulseSummary(
        timeRange,
        currentTeam?.id
      )
      setData(response)
    } catch (err) {
      console.error('Error loading pulse summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 4.0) return '#22c55e' // green
    if (score >= 3.5) return '#84cc16' // lime
    if (score >= 3.0) return '#eab308' // yellow
    if (score >= 2.5) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 4.5) return 'Excellent'
    if (score >= 4.0) return 'Very Good'
    if (score >= 3.5) return 'Good'
    if (score >= 3.0) return 'Fair'
    if (score >= 2.5) return 'Needs Attention'
    return 'Critical'
  }

  const getScoreEmoji = (score: number): string => {
    if (score >= 4.5) return '😄'
    if (score >= 4.0) return '🙂'
    if (score >= 3.5) return '😐'
    if (score >= 3.0) return '😕'
    return '😞'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Error Loading Pulse Data
          </h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={loadPulseSummary}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No pulse data available
          </p>
        </div>
      </div>
    )
  }

  // Calculate overall average from questions (only those with data)
  const questionsWithData = data.questions.filter(
    (q) => q.overallAverage !== null
  )
  const overallAverage =
    questionsWithData.length > 0
      ? questionsWithData.reduce((sum, q) => sum + (q.overallAverage || 0), 0) /
        questionsWithData.length
      : 0
  const belowThreshold = data.summary.totalResponses < data.anonThreshold

  return (
    <div>
      <TeamContextBar
        teamName={currentTeam?.name || null}
        teamSlug={currentTeam?.slug || null}
        teamDescription={currentTeam?.description}
        showSubmitButton={false}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {currentTeam
                  ? `${currentTeam.name} Pulse`
                  : 'Organization Pulse'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentTeam
                  ? 'Team sentiment and engagement insights'
                  : 'Aggregate insights across all teams'}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Time Range:
              </label>
              <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                {(['4w', '8w', '12w'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    style={
                      timeRange === range
                        ? { backgroundColor: themeColors.primary }
                        : undefined
                    }
                  >
                    {range === '4w'
                      ? '4 Weeks'
                      : range === '8w'
                        ? '8 Weeks'
                        : '12 Weeks'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Anonymity Warning */}
        {belowThreshold && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Insufficient Data for Anonymity
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Overall data is hidden because there are fewer than{' '}
                  {data.anonThreshold} responses. We need at least{' '}
                  {data.anonThreshold} responses to protect individual privacy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        {!belowThreshold && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Overall Score Card */}
            <div
              className="rounded-lg shadow-sm p-6 border"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Score
                </h3>
                <span className="text-3xl">
                  {getScoreEmoji(overallAverage)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-bold"
                  style={{ color: getScoreColor(overallAverage) }}
                >
                  {overallAverage.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / 5.00
                </span>
              </div>
              <p
                className="text-sm font-medium mt-2"
                style={{ color: getScoreColor(overallAverage) }}
              >
                {getScoreLabel(overallAverage)}
              </p>
            </div>

            {/* Response Count Card */}
            <div
              className="rounded-lg shadow-sm p-6 border"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Responses
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {data.summary.totalResponses}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Over{' '}
                {timeRange === '4w' ? '4' : timeRange === '8w' ? '8' : '12'}{' '}
                weeks
              </p>
            </div>

            {/* Participation Rate Card */}
            <div
              className="rounded-lg shadow-sm p-6 border"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Participation Rate
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {data.summary.totalInvites > 0
                    ? Math.round(
                        (data.summary.totalResponses /
                          data.summary.totalInvites) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {data.summary.totalResponses} of {data.summary.totalInvites}{' '}
                invites responded
              </p>
            </div>
          </div>
        )}

        {/* Questions Breakdown */}
        <div
          className="rounded-lg shadow-sm border"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <div
            className="p-6 border-b"
            style={{ borderColor: themeColors.border }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Question Breakdown
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Individual question scores and response counts
            </p>
          </div>

          <div className="p-6">
            {data.questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No questions with sufficient responses yet
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {data.questions.map((question) => (
                  <div
                    key={question.questionId}
                    className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
                  >
                    {question.insufficient ? (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-xl">🔒</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {question.questionText}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Insufficient responses — need {data.anonThreshold}{' '}
                            for anonymity
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {question.questionText}
                            </p>
                            {question.category && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                {question.category}
                              </span>
                            )}
                          </div>
                          {question.overallAverage !== null && (
                            <div className="text-right ml-4">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className="text-3xl font-bold"
                                  style={{
                                    color: getScoreColor(
                                      question.overallAverage
                                    ),
                                  }}
                                >
                                  {question.overallAverage.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {getScoreEmoji(question.overallAverage)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Visual bar */}
                        {question.overallAverage !== null && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all"
                              style={{
                                width: `${(question.overallAverage / (question.scale === 'NPS_0_10' ? 10 : 5)) * 100}%`,
                                backgroundColor: getScoreColor(
                                  question.overallAverage
                                ),
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <span>ℹ️</span> About This Data
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • All responses are completely anonymous and cannot be traced to
              individuals
            </li>
            <li>• Scores are shown on a 1-5 scale (1 = lowest, 5 = highest)</li>
            <li>
              • Data is only displayed when there are at least{' '}
              {data.anonThreshold} responses
            </li>
            <li>
              • Historical data shows trends over the selected time period
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
