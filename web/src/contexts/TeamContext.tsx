import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react'
import { apiClient, type Team } from '../lib/api'
import { useSSE } from '../hooks/useSSE'
import type { SSEEvent } from '../hooks/useSSE'

interface TeamContextType {
  currentTeam: Team | null // null = "All Teams" view
  teams: Team[]
  setCurrentTeam: (team: Team | null) => void
  isLoading: boolean
  error: string | null
  refreshTeams: () => Promise<void>
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

const TEAM_STORAGE_KEY = 'ama-selected-team'

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load teams from API
  const loadTeams = async () => {
    try {
      setError(null)
      const teamsData = await apiClient.getTeams()
      setTeams(teamsData)

      // Restore selected team from localStorage
      const savedTeamSlug = localStorage.getItem(TEAM_STORAGE_KEY)
      if (savedTeamSlug && savedTeamSlug !== 'all') {
        const savedTeam = teamsData.find((team) => team.slug === savedTeamSlug)
        if (savedTeam) {
          setCurrentTeamState(savedTeam)
        }
      }
      // If no saved team or saved team not found, currentTeam remains null (All Teams)
    } catch (err) {
      console.error('Failed to load teams:', err)
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }

  // Set current team and persist to localStorage
  const setCurrentTeam = (team: Team | null) => {
    setCurrentTeamState(team)
    if (team) {
      localStorage.setItem(TEAM_STORAGE_KEY, team.slug)
    } else {
      localStorage.setItem(TEAM_STORAGE_KEY, 'all')
    }
  }

  // Refresh teams (useful after creating/updating teams)
  const refreshTeams = async () => {
    await loadTeams()
  }

  useEffect(() => {
    loadTeams()
  }, [])

  // Handle SSE events to update team counts in real-time
  const handleSSEEvent = (event: SSEEvent) => {
    if (event.type === 'question:created') {
      const question = event.data
      if (question.teamId && question.status === 'OPEN') {
        // Increment count for the team
        setTeams((prev) =>
          prev.map((team) =>
            team.id === question.teamId
              ? {
                  ...team,
                  _count: { questions: (team._count?.questions || 0) + 1 },
                }
              : team
          )
        )

        // Also update currentTeam if it matches
        setCurrentTeamState((prev) =>
          prev?.id === question.teamId
            ? {
                ...prev,
                _count: { questions: (prev._count?.questions || 0) + 1 },
              }
            : prev
        )
      }
    } else if (event.type === 'question:answered') {
      const question = event.data
      if (question.teamId) {
        // Decrement count for the team (moved from open to answered)
        setTeams((prev) =>
          prev.map((team) =>
            team.id === question.teamId
              ? {
                  ...team,
                  _count: {
                    questions: Math.max(0, (team._count?.questions || 0) - 1),
                  },
                }
              : team
          )
        )

        // Also update currentTeam if it matches
        setCurrentTeamState((prev) =>
          prev?.id === question.teamId
            ? {
                ...prev,
                _count: {
                  questions: Math.max(0, (prev._count?.questions || 0) - 1),
                },
              }
            : prev
        )
      }
    }
  }

  // Connect to SSE for real-time team count updates
  useSSE({
    onEvent: handleSSEEvent,
  })

  const value: TeamContextType = {
    currentTeam,
    teams,
    setCurrentTeam,
    isLoading,
    error,
    refreshTeams,
  }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}

// Helper function to get team slug for URLs
export function getTeamSlug(team: Team | null): string {
  return team?.slug || 'all'
}

// Helper function to get team display name
export function getTeamDisplayName(team: Team | null): string {
  return team?.name || 'All Teams'
}
