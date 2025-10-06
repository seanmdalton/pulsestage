import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useAuth } from '../contexts/UserContext'

interface SmartRedirectProps {
  fallbackTo: string
}

export function SmartRedirect({ fallbackTo }: SmartRedirectProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { defaultTeam, isLoading: userLoading } = useUser()

  // Determine if we should redirect based on current state
  const shouldRedirect =
    isAuthenticated && !authLoading && !userLoading && defaultTeam

  // Show loading state while we're determining where to redirect
  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is authenticated and has a default team, redirect to it
  if (isAuthenticated && defaultTeam && shouldRedirect) {
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
