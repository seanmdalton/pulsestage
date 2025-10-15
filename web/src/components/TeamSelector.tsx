import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTeam, getTeamDisplayName } from '../contexts/TeamContext'
import { useUser, useAuth } from '../contexts/UserContext'

export function TeamSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Team context
  const { currentTeam, teams, isLoading } = useTeam()

  // User context
  const { isAuthenticated } = useAuth()
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userTeams: _userTeams,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    favorites: _favorites,
    defaultTeam,
    getUserRoleInTeam,
    isTeamFavorite,
    toggleTeamFavorite,
    setDefaultTeam,
  } = useUser()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Enhanced filtering with user context
  const filteredTeams = teams
    .filter(
      (team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by: favorites first, then default team, then by name
      const aIsFavorite = isAuthenticated && isTeamFavorite(a.id)
      const bIsFavorite = isAuthenticated && isTeamFavorite(b.id)
      const aIsDefault = isAuthenticated && defaultTeam?.id === a.id
      const bIsDefault = isAuthenticated && defaultTeam?.id === b.id

      // Favorites first
      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1

      // Default team second
      if (aIsDefault && !bIsDefault) return -1
      if (!aIsDefault && bIsDefault) return 1

      // Then alphabetically
      return a.name.localeCompare(b.name)
    })

  // Get teams that are user's favorites (for display)
  const favoriteTeams = isAuthenticated
    ? filteredTeams.filter((team) => isTeamFavorite(team.id))
    : []

  // Get teams that are not favorites
  const otherTeams = isAuthenticated
    ? filteredTeams.filter((team) => !isTeamFavorite(team.id))
    : filteredTeams

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleTeamSelect = (teamSlug: string) => {
    setIsOpen(false)
    setSearchQuery('')

    // Determine the current page type from the URL
    const pathParts = location.pathname.split('/').filter(Boolean)
    let pageType = ''

    if (pathParts.length >= 2) {
      pageType = pathParts[1] // 'open' or 'answered'
    }

    // Navigate to the same page type but for the selected team
    if (pageType === 'open' || pageType === 'answered') {
      navigate(`/${teamSlug}/${pageType}`)
    } else {
      navigate(`/${teamSlug}`)
    }
  }

  // Handle favorite toggle
  const handleToggleFavorite = async (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation()
    if (!isAuthenticated) return

    try {
      await toggleTeamFavorite(teamId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      // Could add a toast notification here
    }
  }

  // Handle set as default
  const handleSetDefault = async (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation()
    if (!isAuthenticated) return

    try {
      await setDefaultTeam(teamId)
    } catch (error) {
      console.error('Failed to set default team:', error)
      // Could add a toast notification here
    }
  }

  // Render individual team item with user context
  const renderTeamItem = (team: { id: string; name: string; slug: string }) => {
    const userRole = isAuthenticated ? getUserRoleInTeam(team.id) : null
    const isFavorite = isAuthenticated && isTeamFavorite(team.id)
    const isDefault = isAuthenticated && defaultTeam?.id === team.id
    const isCurrent = currentTeam?.id === team.id

    return (
      <div
        key={team.id}
        className={`relative group ${
          isCurrent
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        } transition-colors`}
      >
        <button
          onClick={() => handleTeamSelect(team.slug)}
          className="w-full text-left px-4 py-2 text-sm focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {/* Team name with indicators */}
              <div className="flex items-center space-x-1 min-w-0">
                <span className="font-medium truncate">{team.name}</span>

                {/* Default team indicator */}
                {isDefault && (
                  <svg
                    className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0"
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

                {/* Role indicator - Show for all roles */}
                {userRole && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      userRole === 'owner'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : userRole === 'admin'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : userRole === 'moderator'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {userRole}
                  </span>
                )}
              </div>

              {/* Question count */}
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {(team as any)._count?.questions || 0} questions
              </span>
            </div>
          </div>

          {/* Team description */}
          {(team as any).description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {(team as any).description}
            </div>
          )}
        </button>

        {/* Action buttons (only show on hover for authenticated users) */}
        {isAuthenticated && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Favorite toggle */}
            <button
              onClick={(e) => handleToggleFavorite(e, team.id)}
              className={`p-1 rounded-full transition-colors ${
                isFavorite
                  ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                  : 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className="w-3 h-3"
                fill={isFavorite ? 'currentColor' : 'none'}
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
            </button>

            {/* Set as default */}
            {!isDefault && (
              <button
                onClick={(e) => handleSetDefault(e, team.id)}
                className="p-1 rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                title="Set as default team"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading teams...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate max-w-32 sm:max-w-none">
          {getTeamDisplayName(currentTeam)}
        </span>
        {currentTeam?._count && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {currentTeam._count.questions}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {filteredTeams.length} team
                {filteredTeams.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="overflow-y-auto max-h-80">
            <div className="py-1">
              {/* All Teams option - always show unless searching */}
              {!searchQuery && (
                <>
                  <button
                    onClick={() => handleTeamSelect('all')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      currentTeam === null
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">All Teams</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {teams.reduce(
                          (sum, team) => sum + (team._count?.questions || 0),
                          0
                        )}{' '}
                        total
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      View questions from all teams
                    </div>
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                </>
              )}

              {/* Favorite Teams Section (only show if authenticated and has favorites) */}
              {isAuthenticated && favoriteTeams.length > 0 && !searchQuery && (
                <>
                  <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                    <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300 flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Favorite Teams
                    </div>
                  </div>
                  {favoriteTeams.map((team) => renderTeamItem(team))}

                  {otherTeams.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  )}
                </>
              )}

              {/* Individual teams */}
              {(filteredTeams.length > 0 ? otherTeams : filteredTeams).length >
              0 ? (
                (filteredTeams.length > 0 ? otherTeams : filteredTeams).map(
                  (team) => renderTeamItem(team)
                )
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-8 w-8 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-sm">No teams found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
