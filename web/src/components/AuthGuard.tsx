import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Auth Guard - Requires authentication to access protected routes
 * Redirects to /login if not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useUser()
  const location = useLocation()

  // Show nothing while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-pulse-dark">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is authenticated, render children
  return <>{children}</>
}
