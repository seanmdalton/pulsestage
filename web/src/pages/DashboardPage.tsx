import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiClient } from '../lib/api'
import type { Question, PulseInvite, PulseHistoryWeek } from '../lib/api'
import { useUser } from '../contexts/UserContext'
import { getTeamSlug } from '../contexts/TeamContext'
import { useTeamFromUrl } from '../hooks/useTeamFromUrl'
import { useTheme } from '../contexts/ThemeContext'
import { setFormattedPageTitle } from '../utils/titleUtils'
import { TeamContextBar } from '../components/TeamContextBar'

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const { currentTeam } = useTeamFromUrl()
  const { theme, colorMode } = useTheme()
  const themeColors = colorMode === 'light' ? theme.light : theme.dark

  const [stats, setStats] = useState({
    openQuestions: 0,
    answeredThisWeek: 0,
    trending: 0,
  })
  const [trendingQuestions, setTrendingQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingPulseInvites, setPendingPulseInvites] = useState<PulseInvite[]>(
    []
  )
  const [pulseHistory, setPulseHistory] = useState<PulseHistoryWeek[]>([])
  const [userActivity, setUserActivity] = useState({
    questionsAsked: 0,
    questionsUpvoted: 0,
  })

  const teamSlug = getTeamSlug(currentTeam)

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'dashboard')
  }, [currentTeam?.slug])

  // Reload dashboard data when navigating back to this page or when team changes
  useEffect(() => {
    loadDashboardData()
  }, [currentTeam?.id, location.pathname])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load open questions count
      const openQuestions = await apiClient.getQuestions(
        'OPEN',
        currentTeam?.id
      )

      // Load answered questions from last 7 days
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const answeredQuestions = await apiClient.getQuestions(
        'ANSWERED',
        currentTeam?.id
      )
      const answeredThisWeek = answeredQuestions.filter(
        (q) => new Date(q.respondedAt || q.updatedAt) > oneWeekAgo
      )

      // Get top 3 trending questions (by upvotes)
      const trending = [...openQuestions]
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 3)

      setStats({
        openQuestions: openQuestions.length,
        answeredThisWeek: answeredThisWeek.length,
        trending: trending.length,
      })
      setTrendingQuestions(trending)

      // Load pending pulse invites
      try {
        const { invites } = await apiClient.getMyPulseInvites()
        setPendingPulseInvites(invites)
      } catch (error) {
        console.warn('Could not load pulse invites:', error)
      }

      // Load pulse history
      try {
        const { history } = await apiClient.getMyPulseHistory(4) // Last 4 weeks
        setPulseHistory(history)
      } catch (error) {
        console.warn('Could not load pulse history:', error)
      }

      // Calculate user activity
      try {
        const [myQuestions, upvoteData] = await Promise.all([
          apiClient.getUserQuestions(),
          apiClient.getMyUpvoteCount(),
        ])

        setUserActivity({
          questionsAsked: myQuestions.length,
          questionsUpvoted: upvoteData.count,
        })
      } catch (error) {
        console.warn('Could not load user activity:', error)
        // Keep as 0 if error occurs
        setUserActivity({
          questionsAsked: 0,
          questionsUpvoted: 0,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <TeamContextBar
        teamName={currentTeam?.name || null}
        teamSlug={currentTeam?.slug || null}
        teamDescription={currentTeam?.description}
        showSubmitButton={true}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening in{' '}
            {currentTeam ? currentTeam.name : 'all teams'}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Pulse Card */}
          <div
            className="rounded-lg shadow-sm p-6 border"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                💙 Weekly Pulse
              </h2>
              {pendingPulseInvites.length > 0 && (
                <span
                  className="px-2 py-1 text-xs font-medium text-white rounded-full"
                  style={{ backgroundColor: themeColors.accent }}
                >
                  {pendingPulseInvites.length}
                </span>
              )}
            </div>

            {pendingPulseInvites.length > 0 ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {pendingPulseInvites[0].questionText}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  {pendingPulseInvites.length === 1
                    ? '1 pending response'
                    : `${pendingPulseInvites.length} pending responses`}
                </p>
                <button
                  onClick={() =>
                    navigate(
                      `/pulse/respond?token=${pendingPulseInvites[0].token}`
                    )
                  }
                  className="w-full px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: themeColors.accent }}
                >
                  Respond Now →
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Quick weekly check-in on team sentiment and engagement.
                </p>
                <button
                  onClick={() => navigate(`/${teamSlug}/pulse/dashboard`)}
                  className="w-full px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  View Pulse Dashboard →
                </button>
              </>
            )}
          </div>

          {/* Q&A Activity Card */}
          <div
            className="rounded-lg shadow-sm p-6 border lg:col-span-2"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              💬 Q&A Activity
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.openQuestions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Open Questions
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.answeredThisWeek}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Answered This Week
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.trending}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trending
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/${teamSlug}/questions`)}
              className="mt-4 text-sm font-medium hover:underline"
              style={{ color: themeColors.primary }}
            >
              View All Questions →
            </button>
          </div>
        </div>

        {/* Your Activity & Pulse History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Your Activity */}
          <div
            className="rounded-lg shadow-sm p-6 border"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              👤 Your Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">❓</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Questions Asked
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total questions you've submitted
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userActivity.questionsAsked}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">▲</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Questions Upvoted
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Questions you've supported
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {userActivity.questionsUpvoted}
                </div>
              </div>
            </div>
          </div>

          {/* Your Pulse History */}
          <div
            className="rounded-lg shadow-sm p-6 border"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📈 Your Pulse History
            </h2>
            {pulseHistory.length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {pulseHistory.slice(0, 4).map((week, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded"
                      style={{
                        backgroundColor:
                          week.responseCount > 0
                            ? `${themeColors.primary}10`
                            : 'transparent',
                      }}
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Week of{' '}
                        {new Date(week.weekStart).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric' }
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {week.responseCount > 0 ? (
                          <>
                            <div
                              className="text-sm font-semibold"
                              style={{ color: themeColors.primary }}
                            >
                              ✓ Completed
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ({week.responseCount}{' '}
                              {week.responseCount === 1
                                ? 'check-in'
                                : 'check-ins'}
                              )
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            No response
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="pt-3 border-t"
                  style={{ borderColor: themeColors.border }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      4-week participation:
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: themeColors.primary }}
                    >
                      {pulseHistory.filter((w) => w.responseCount > 0).length} /
                      4 weeks
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💙</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No pulse responses yet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your weekly check-ins will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trending This Week */}
        {trendingQuestions.length > 0 && (
          <div
            className="rounded-lg shadow-sm p-6 border mb-8"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🔥 Trending This Week
              </h2>
            </div>
            <div className="space-y-3">
              {trendingQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderColor: themeColors.border }}
                  onClick={() => navigate(`/questions/${q.id}`)}
                >
                  <div className="flex-shrink-0 text-2xl font-bold text-gray-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {q.body}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-orange-500">▲</span>
                        {q.upvotes} votes
                      </span>
                      {q.team && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {q.team.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {trendingQuestions.length === 0 && (
          <div
            className="rounded-lg shadow-sm p-12 border text-center"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No questions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to ask a question and start a conversation!
            </p>
            <button
              onClick={() => navigate(`/${teamSlug}`)}
              className="px-6 py-2 text-white font-medium rounded-md shadow-sm transition-colors"
              style={{ backgroundColor: themeColors.primary }}
            >
              Submit Your First Question
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
