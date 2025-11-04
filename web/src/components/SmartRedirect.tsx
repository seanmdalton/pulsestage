import { Navigate, useLocation } from 'react-router-dom'
import { useUser, useAuth } from '../contexts/UserContext'

interface SmartRedirectProps {
  fallbackTo: string
}

/**
 * SmartRedirect - Redirects authenticated users to their home team (primary) or fallback
 * Priority: home team (primaryTeam) > fallback
 * Note: This component is only rendered inside AuthGuard, so user is always authenticated
 */
export function SmartRedirect({ fallbackTo }: SmartRedirectProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { isLoading } = useUser()

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Priority 1: User's home team (primary team)
  if (user?.primaryTeam) {
    const currentPath = location.pathname
    const homeTeamPath =
      currentPath === '/' || currentPath === ''
        ? `/${user.primaryTeam.slug}/dashboard` // Always go to dashboard when redirecting from root
        : `/${user.primaryTeam.slug}${currentPath.substring(4)}` // Replace '/all' with team slug

    return <Navigate to={homeTeamPath} replace />
  }

  // Priority 2: Fallback to the provided route (usually '/all')
  return <Navigate to={fallbackTo} replace />
}
