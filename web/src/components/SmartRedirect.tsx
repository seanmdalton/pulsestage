import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

interface SmartRedirectProps {
  fallbackTo: string
}

/**
 * SmartRedirect - Redirects authenticated users to their default team or a fallback
 * Note: This component is only rendered inside AuthGuard, so user is always authenticated
 */
export function SmartRedirect({ fallbackTo }: SmartRedirectProps) {
  const location = useLocation()
  const { defaultTeam, isLoading } = useUser()

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user has a default team, redirect to it
  if (defaultTeam) {
    const currentPath = location.pathname
    const defaultTeamPath =
      currentPath === '/'
        ? `/${defaultTeam.slug}`
        : `/${defaultTeam.slug}${currentPath.substring(4)}` // Replace '/all' with team slug

    return <Navigate to={defaultTeamPath} replace />
  }

  // Fallback to the provided route (usually '/all')
  return <Navigate to={fallbackTo} replace />
}
