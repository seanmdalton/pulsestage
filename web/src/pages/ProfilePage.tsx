import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '../contexts/UserContext'
import { setFormattedPageTitle } from '../utils/titleUtils'
import { apiClient } from '../lib/api'

export function ProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const {
    userTeams,
    favorites,
    userQuestions,
    getUserRoleInTeam,
    toggleTeamFavorite,
    refreshUser,
  } = useUser()

  // Determine active tab based on current route
  const getActiveTab = (): 'overview' | 'questions' => {
    if (location.pathname === '/profile/questions') {
      return 'questions'
    } else {
      return 'overview'
    }
  }
  const activeTab = getActiveTab()

  // Navigate to different tabs
  const setActiveTab = (tab: 'overview' | 'questions') => {
    if (tab === 'overview') {
      navigate('/profile')
    } else if (tab === 'questions') {
      navigate('/profile/questions')
    }
  }

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(undefined, 'profile')
  }, [])

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-medium">
                {user.name
                  ?.split(' ')
                  .map((word) => word.charAt(0))
                  .join('')
                  .toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.name || 'User Profile'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {userTeams.length} team{userTeams.length !== 1 ? 's' : ''} •{' '}
                    {favorites.length} favorite
                    {favorites.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            {/* Home Team Badge */}
            {user.primaryTeam && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Home Team
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏠</span>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.primaryTeam.name}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                My Questions ({userQuestions.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Overview
              </h2>

              {/* Home Team Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  🏠 Home Team
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your home team determines which pulse surveys you receive and
                  is your default view when you open PulseStage.
                </p>
                {user.primaryTeam ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg">
                          🏠
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-300">
                            {user.primaryTeam.name}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            {user.primaryTeam.description ||
                              'Your current home team'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          // Scroll to team list
                          document
                            .getElementById('home-team-selector')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Change Home Team
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No home team set. You can set your home team from the team
                      cards below.
                    </p>
                  </div>
                )}
              </div>

              {/* Team Memberships */}
              <div id="home-team-selector">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Team Memberships
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Click "Set as Home Team" to change which pulse surveys you
                  receive. Star teams for quick access in the team selector.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTeams.map((team) => {
                    const role = getUserRoleInTeam(team.id)
                    const isFavorite = favorites.includes(team.id)
                    const isHomeTeam = user.primaryTeamId === team.id

                    return (
                      <div
                        key={team.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </h4>
                          {isHomeTeam && (
                            <span className="text-lg" title="Home Team">
                              🏠
                            </span>
                          )}
                        </div>
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {team.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              role === 'owner'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : role === 'admin'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : role === 'moderator'
                                    ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {role}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {team._count?.questions || 0} questions
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await toggleTeamFavorite(team.id)
                              } catch (error) {
                                console.error(
                                  'Failed to toggle favorite:',
                                  error
                                )
                              }
                            }}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              isFavorite
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {isFavorite ? '★ Favorited' : '☆ Favorite'}
                          </button>
                          <button
                            onClick={async () => {
                              console.log('Set Home Team clicked:', {
                                teamId: team.id,
                                teamName: team.name,
                                isHomeTeam,
                                userPrimaryTeamId: user.primaryTeamId,
                              })
                              try {
                                if (!isHomeTeam) {
                                  console.log('Calling updatePrimaryTeam...')
                                  await apiClient.updatePrimaryTeam(team.id)
                                  console.log(
                                    'Update successful, refreshing user...'
                                  )
                                  await refreshUser() // Refresh to show updated home team
                                  // Scroll back to top to show the update
                                  window.scrollTo({
                                    top: 0,
                                    behavior: 'smooth',
                                  })
                                } else {
                                  console.log(
                                    'Team is already home team, skipping'
                                  )
                                }
                              } catch (error) {
                                console.error('Failed to set home team:', error)
                              }
                            }}
                            disabled={isHomeTeam}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              isHomeTeam
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {isHomeTeam ? '🏠 Home Team' : 'Set as Home Team'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  My Questions
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {userQuestions.length} question
                  {userQuestions.length !== 1 ? 's' : ''}
                </div>
              </div>

              {userQuestions.length > 0 ? (
                <div className="space-y-4">
                  {userQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              question.status === 'ANSWERED'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : question.status === 'UNDER_REVIEW'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {question.status === 'ANSWERED'
                              ? 'Answered'
                              : question.status === 'UNDER_REVIEW'
                                ? 'Under Review'
                                : 'Open'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium">
                            {question.upvotes} upvote
                            {question.upvotes !== 1 ? 's' : ''}
                          </span>
                          {question.team && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                              {question.team.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(question.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-gray-900 dark:text-gray-100 mb-3 line-clamp-3">
                        {question.body}
                      </p>

                      {question.status === 'ANSWERED' &&
                        question.responseText && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <svg
                                className="w-4 h-4 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                Response
                              </span>
                              {question.respondedAt && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  {new Date(
                                    question.respondedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-400 line-clamp-2">
                              {question.responseText}
                            </p>
                          </div>
                        )}

                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {question.tags.map((questionTag) => (
                            <span
                              key={questionTag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${questionTag.tag.color}20`,
                                color: questionTag.tag.color,
                              }}
                            >
                              {questionTag.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No questions yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You haven't submitted any questions yet. Start by asking a
                    question on any team page.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
