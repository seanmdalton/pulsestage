import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from 'react'
import {
  apiClient,
  type User,
  type TeamWithMembership,
  type UserPreferences,
  type Question,
} from '../lib/api'

interface UserContextType {
  // User state
  user: User | null
  userTeams: TeamWithMembership[]
  userPreferences: UserPreferences | null
  favorites: string[]
  defaultTeam: TeamWithMembership | null
  userQuestions: Question[]

  // Loading and error states
  isLoading: boolean
  error: string | null

  // Actions
  refreshUser: () => Promise<void>
  refreshUserTeams: () => Promise<void>
  refreshUserQuestions: () => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  toggleTeamFavorite: (teamId: string) => Promise<void>
  setDefaultTeam: (teamId: string) => Promise<void>

  // Utility functions
  getUserRoleInTeam: (
    teamId: string
  ) => 'member' | 'moderator' | 'admin' | 'owner' | null
  isTeamFavorite: (teamId: string) => boolean
  canUserAccessTeam: (teamId: string) => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Storage keys for persistence
const USER_STORAGE_KEY = 'ama-user-data'
const FAVORITES_STORAGE_KEY = 'ama-user-favorites'

export function UserProvider({ children }: { children: ReactNode }) {
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [userTeams, setUserTeams] = useState<TeamWithMembership[]>([])
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [defaultTeam, setDefaultTeam] = useState<TeamWithMembership | null>(
    null
  )
  const [userQuestions, setUserQuestions] = useState<Question[]>([])

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user data from API
  const loadUserData = async () => {
    try {
      setError(null)

      // Try to get current user from session (works for demo mode, OAuth, and legacy mock SSO)
      try {
        const userData = await apiClient.getCurrentUser()
        setUser(userData)

        // Load user teams and preferences
        const teamsResponse = await apiClient.getUserTeams()
        setUserTeams(teamsResponse.teams)
        setFavorites(teamsResponse.favorites)
        setDefaultTeam(teamsResponse.defaultTeam || null)

        // Load user questions
        const questions = await apiClient.getUserQuestions()
        setUserQuestions(questions)

        // Store user data in localStorage for caching
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(teamsResponse.favorites)
        )
      } catch {
        // User not authenticated - AuthGuard will redirect to /login
        // This catch block handles API failures gracefully
        setUser(null)
        setUserTeams([])
        setFavorites([])
        setDefaultTeam(null)
        setUserQuestions([])

        // Clear any stale localStorage data when not authenticated
        localStorage.removeItem(USER_STORAGE_KEY)
        localStorage.removeItem(FAVORITES_STORAGE_KEY)
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    setIsLoading(true)
    await loadUserData()
  }

  // Refresh user teams
  const refreshUserTeams = async () => {
    if (!user) return

    try {
      const teamsResponse = await apiClient.getUserTeams()
      setUserTeams(teamsResponse.teams)
      setFavorites(teamsResponse.favorites)
      setDefaultTeam(teamsResponse.defaultTeam || null)

      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(teamsResponse.favorites)
      )
    } catch (err) {
      console.error('Failed to refresh user teams:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to refresh user teams'
      )
    }
  }

  // Refresh user questions
  const refreshUserQuestions = async () => {
    if (!user) return

    try {
      const questions = await apiClient.getUserQuestions()
      setUserQuestions(questions)
    } catch (err) {
      console.error('Failed to refresh user questions:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to refresh user questions'
      )
    }
  }

  // Update user preferences
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) return

    try {
      const updatedPreferences = await apiClient.updateUserPreferences({
        favoriteTeams: preferences.favoriteTeams,
        defaultTeamId: preferences.defaultTeamId,
      })

      setUserPreferences(updatedPreferences)

      // Update local state
      if (preferences.favoriteTeams) {
        setFavorites(preferences.favoriteTeams)
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(preferences.favoriteTeams)
        )
      }

      if (preferences.defaultTeamId) {
        const newDefaultTeam = userTeams.find(
          (team) => team.id === preferences.defaultTeamId
        )
        setDefaultTeam(newDefaultTeam || null)
      }
    } catch (err) {
      console.error('Failed to update preferences:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to update preferences'
      )
      throw err
    }
  }

  // Toggle team favorite
  const toggleTeamFavorite = async (teamId: string) => {
    if (!user) return

    try {
      const response = await apiClient.toggleTeamFavorite(teamId)

      // Update local state
      const newFavorites = response.isFavorite
        ? [...favorites, teamId]
        : favorites.filter((id) => id !== teamId)

      setFavorites(newFavorites)
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites))

      // Update team data
      setUserTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === teamId
            ? { ...team, isFavorite: response.isFavorite }
            : team
        )
      )
    } catch (err) {
      console.error('Failed to toggle team favorite:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to toggle team favorite'
      )
      throw err
    }
  }

  // Set default team
  const setDefaultTeamAction = async (teamId: string | null) => {
    if (!user) return

    try {
      await updatePreferences({ defaultTeamId: teamId || undefined })

      const newDefaultTeam = teamId
        ? userTeams.find((team) => team.id === teamId)
        : null
      setDefaultTeam(newDefaultTeam || null)
    } catch (err) {
      console.error('Failed to set default team:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to set default team'
      )
      throw err
    }
  }

  // Utility functions
  const getUserRoleInTeam = (
    teamId: string
  ): 'member' | 'moderator' | 'admin' | 'owner' | null => {
    const team = userTeams.find((t) => t.id === teamId)
    return team?.userRole || null
  }

  const isTeamFavorite = (teamId: string): boolean => {
    return favorites.includes(teamId)
  }

  const canUserAccessTeam = (teamId: string): boolean => {
    return userTeams.some((team) => team.id === teamId)
  }

  // Load user data on mount
  useEffect(() => {
    loadUserData()
  }, [])

  const value: UserContextType = {
    // User state
    user,
    userTeams,
    userPreferences,
    favorites,
    defaultTeam,
    userQuestions,

    // Loading and error states
    isLoading,
    error,

    // Actions
    refreshUser,
    refreshUserTeams,
    refreshUserQuestions,
    updatePreferences,
    toggleTeamFavorite,
    setDefaultTeam: setDefaultTeamAction,

    // Utility functions
    getUserRoleInTeam,
    isTeamFavorite,
    canUserAccessTeam,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Helper hook for checking if user is authenticated
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const { user, isLoading } = useUser()
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  }
}

// Helper hook for team-related user operations
// eslint-disable-next-line react-refresh/only-export-components
export function useUserTeams() {
  const {
    userTeams,
    favorites,
    defaultTeam,
    isLoading,
    getUserRoleInTeam,
    isTeamFavorite,
    canUserAccessTeam,
    toggleTeamFavorite,
    setDefaultTeam,
  } = useUser()

  return {
    userTeams,
    favorites,
    defaultTeam,
    isLoading,
    getUserRoleInTeam,
    isTeamFavorite,
    canUserAccessTeam,
    toggleTeamFavorite,
    setDefaultTeam,
  }
}
