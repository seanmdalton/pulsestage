import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { apiClient } from '../lib/api'

interface ModerationStats {
  overall: {
    totalQuestionsReviewed: number
    totalQuestionsAnswered: number
    totalQuestionsPinned: number
    totalQuestionsFrozen: number
    activeModerators: number
    avgResponseTime: number | null
  }
  byModerator: Array<{
    moderatorId: string
    moderatorName: string
    moderatorEmail: string
    questionsReviewed: number
    questionsAnswered: number
    questionsPinned: number
    questionsFrozen: number
    avgResponseTime: number | null
    teamsCount: number
  }>
}

export function ModeratorDashboardPage() {
  const { userTeams, getUserRoleInTeam } = useUser()
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Count teams where user is a moderator/admin/owner
  const moderatedTeams = userTeams.filter((team) => {
    const role = getUserRoleInTeam(team.id)
    return role !== null && ['moderator', 'admin', 'owner'].includes(role)
  })

  // Load moderation stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const data = await apiClient.getModerationStats({})
        setStats(data)
      } catch (err) {
        console.error('Failed to load moderation stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [])

  const formatMinutes = (minutes: number | null) => {
    if (minutes === null) return 'N/A'
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Moderator Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review flagged content and manage question moderation across{' '}
          {moderatedTeams.length}{' '}
          {moderatedTeams.length === 1 ? 'team' : 'teams'}
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Review Queue Card */}
        <Link
          to="/moderator/queue?status=under_review"
          className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Review Queue
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Review questions flagged by content moderation
              </p>
              <div className="flex items-center text-sm text-orange-600 dark:text-orange-400 font-medium">
                <span>View pending reviews</span>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Answer Questions Card (OPEN status) */}
        <Link
          to="/moderator/queue?status=open"
          className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Answer Questions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                View and respond to open questions
              </p>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                <span>Go to moderation queue</span>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Export Questions Card */}
        <Link
          to="/moderator/export"
          className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Export Questions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Export questions data to CSV
              </p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                <span>Go to export tool</span>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Your Teams Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Teams You Moderate
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moderatedTeams.map((team) => {
            const role = getUserRoleInTeam(team.id)
            return (
              <div
                key={team.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {team.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {team.description || 'No description'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Moderation Stats Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Moderation Statistics
        </h2>

        {statsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              Loading stats...
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Overall Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Reviewed
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.overall.totalQuestionsReviewed}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Answered
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.overall.totalQuestionsAnswered}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pinned
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.overall.totalQuestionsPinned}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Frozen
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.overall.totalQuestionsFrozen}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Avg Response Time
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatMinutes(stats.overall.avgResponseTime)}
                </div>
              </div>
            </div>

            {/* Moderators Table */}
            {stats.byModerator.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Moderator Activity
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Moderator
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Reviewed
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Answered
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Avg Response Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.byModerator.map((mod) => (
                        <tr key={mod.moderatorId}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {mod.moderatorName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {mod.questionsReviewed}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {mod.questionsAnswered}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatMinutes(mod.avgResponseTime)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              No stats available
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
