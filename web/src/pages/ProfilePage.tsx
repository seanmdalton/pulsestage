import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, useUser } from '../contexts/UserContext'
import { setFormattedPageTitle } from '../utils/titleUtils'

export function ProfilePage() {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const {
    userTeams,
    favorites,
    defaultTeam,
    userQuestions,
    getUserRoleInTeam,
    toggleTeamFavorite,
    setDefaultTeam,
  } = useUser()

  // Determine active tab based on current route
  const getActiveTab = (): 'overview' | 'favorites' | 'questions' => {
    if (location.pathname === '/profile/favorites') {
      return 'favorites'
    } else if (location.pathname === '/profile/questions') {
      return 'questions'
    } else {
      return 'overview'
    }
  }
  const activeTab = getActiveTab()

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

  const favoriteTeams = userTeams.filter((team) => favorites.includes(team.id))
  const teamsWithRoles = userTeams.filter(
    (team) => getUserRoleInTeam(team.id) !== 'member'
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
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
                  {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
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
                onClick={() => setActiveTab('favorites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'favorites'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Favorite Teams ({favorites.length})
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

              {/* Default Team */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Default Team
                </h3>
                {defaultTeam ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {defaultTeam.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-300">
                            {defaultTeam.name}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            {defaultTeam.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await setDefaultTeam(null)
                          } catch (error) {
                            console.error(
                              'Failed to remove default team:',
                              error
                            )
                          }
                        }}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors"
                      >
                        Remove Default
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No default team set. You can set a default team from the
                      team cards below.
                    </p>
                  </div>
                )}
              </div>

              {/* Team Memberships */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Team Memberships
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTeams.map((team) => {
                    const role = getUserRoleInTeam(team.id)
                    const isFavorite = favorites.includes(team.id)
                    const isDefault = defaultTeam?.id === team.id

                    return (
                      <div
                        key={team.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {isFavorite && (
                              <svg
                                className="w-4 h-4 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                            {isDefault && (
                              <svg
                                className="w-4 h-4 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
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
                              try {
                                if (isDefault) {
                                  await setDefaultTeam(null)
                                } else {
                                  await setDefaultTeam(team.id)
                                }
                              } catch (error) {
                                console.error(
                                  'Failed to set default team:',
                                  error
                                )
                              }
                            }}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              isDefault
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {isDefault ? '✓ Default' : 'Set Default'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Favorite Teams
              </h2>

              {favoriteTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteTeams.map((team) => {
                    const role = getUserRoleInTeam(team.id)
                    const isDefault = defaultTeam?.id === team.id

                    return (
                      <div
                        key={team.id}
                        className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-300">
                            {team.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {isDefault && (
                              <svg
                                className="w-4 h-4 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        {team.description && (
                          <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-2">
                            {team.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
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
                          <span className="text-xs text-yellow-700 dark:text-yellow-500">
                            {team._count?.questions || 0} questions
                          </span>
                        </div>
                      </div>
                    )
                  })}
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
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No favorite teams
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start favoriting teams from the team selector to see them
                    here.
                  </p>
                </div>
              )}
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
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {question.status === 'ANSWERED'
                              ? 'Answered'
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
