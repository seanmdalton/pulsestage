import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, type Team } from '../lib/api'
import { useUser } from '../contexts/UserContext'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    try {
      setLoading(true)
      const response = await apiClient.getAvailableTeams()
      setTeams(response.teams)

      // Pre-select the first non-General team if available
      const nonGeneralTeams = response.teams.filter((t) => t.slug !== 'general')
      if (nonGeneralTeams.length > 0) {
        setSelectedTeamId(nonGeneralTeams[0].id)
      } else if (response.teams.length > 0) {
        setSelectedTeamId(response.teams[0].id)
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
      setError('Failed to load teams. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedTeamId) {
      setError('Please select a team')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await apiClient.updatePrimaryTeam(selectedTeamId)
      await refreshUser() // Refresh user data to get updated primary team

      // Navigate to dashboard
      navigate('/all/dashboard')
    } catch (err) {
      console.error('Failed to update primary team:', err)
      setError('Failed to select team. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Home Team
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your home team determines which pulse surveys you receive and your
            default view
          </p>
        </div>

        {/* Team Selection Form */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="team-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
              >
                Select your home team
              </label>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {teams.map((team) => (
                  <label
                    key={team.id}
                    className={`
                      relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-colors
                      ${
                        selectedTeamId === team.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team.id}
                      checked={selectedTeamId === team.id}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </span>
                        {team.slug === 'general' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            Default
                          </span>
                        )}
                      </div>
                      {team.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={!selectedTeamId || submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Confirming...
                  </span>
                ) : (
                  'Continue to Dashboard'
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                You can change your primary team anytime in your settings
              </p>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                What is a home team?
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                Your home team determines which pulse surveys you receive and is
                your default view when you open PulseStage. You can change it
                anytime in your profile settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
