import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api'
import { useAdmin } from '../contexts/AdminContext'
import { useUser } from '../contexts/UserContext'
import { TeamManagement } from '../components/TeamManagement'
import { TagManagement } from '../components/TagManagement'
import { Settings } from '../components/Settings'
import { UserManagement } from '../components/UserManagement'
import { useTheme } from '../contexts/ThemeContext'
import { AuditPage } from './AuditPage'
import { setFormattedPageTitle } from '../utils/titleUtils'

export function AdminPage() {
  const { isLoading: authLoading } = useAdmin()
  const { userTeams, getUserRoleInTeam } = useUser()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    'teams' | 'tags' | 'users' | 'audit' | 'settings'
  >('teams')
  const [healthStatus, setHealthStatus] = useState<
    'checking' | 'healthy' | 'unhealthy'
  >('checking')

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(undefined, 'admin')
  }, [])

  // Check admin access and handle authentication
  useEffect(() => {
    if (authLoading) return // Wait for auth to load

    // Check if user has moderator role or higher in any team
    const hasAdminRole = userTeams.some((team) => {
      const role = getUserRoleInTeam(team.id)
      return role === 'moderator' || role === 'admin' || role === 'owner'
    })

    if (userTeams.length === 0) {
      // No user context yet, wait for it to load
      return
    }

    if (!hasAdminRole) {
      // User doesn't have admin role, redirect to home
      navigate('/all')
      return
    }

    // If user has admin role, we'll bypass the AdminContext authentication
    // and allow direct access to admin features
  }, [authLoading, userTeams, getUserRoleInTeam, navigate])

  // Check API health status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.getHealth()
        setHealthStatus('healthy')
      } catch {
        setHealthStatus('unhealthy')
      }
    }
    checkHealth()
  }, [])

  // Check if user has moderator role or higher
  const hasAdminRole = userTeams.some((team) => {
    const role = getUserRoleInTeam(team.id)
    return role === 'moderator' || role === 'admin' || role === 'owner'
  })

  // Check if user has full admin role (admin or owner) for admin-only features
  const hasFullAdminRole = userTeams.some((team) => {
    const role = getUserRoleInTeam(team.id)
    return role === 'admin' || role === 'owner'
  })

  // Show loading while checking user roles
  if (userTeams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Admin Panel
        </h1>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  // Redirect if user doesn't have admin role
  if (!hasAdminRole) {
    return null // The useEffect will handle the redirect
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Icon only */}
            <img
              src={
                theme === 'dark'
                  ? '/pulsestage-icon-light.svg'
                  : '/pulsestage-icon-dark.svg'
              }
              alt="PulseStage Icon"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                System administration and configuration
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* API Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                API Status:
              </div>
              <div
                data-testid="health-status"
                className={`w-3 h-3 rounded-full ${
                  healthStatus === 'healthy'
                    ? 'bg-green-500'
                    : healthStatus === 'unhealthy'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                }`}
                title={
                  healthStatus === 'healthy'
                    ? 'API is healthy'
                    : healthStatus === 'unhealthy'
                      ? 'API is unhealthy'
                      : 'Checking API status...'
                }
              />
            </div>

            <button
              onClick={() => navigate('/all/open/present')}
              className="px-4 py-2 text-sm rounded-md transition-colors self-start sm:self-auto bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
              title="Enter presentation mode"
            >
              Presentation Mode
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Teams
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tags'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Tags
            </button>
            {/* Users, Audit, and Settings tabs - admin/owner only */}
            {hasFullAdminRole && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'audit'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Audit Log
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Settings
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'teams' && <TeamManagement />}

        {activeTab === 'tags' && <TagManagement />}

        {/* Users, Audit, and Settings content - admin/owner only */}
        {hasFullAdminRole && activeTab === 'users' && <UserManagement />}

        {hasFullAdminRole && activeTab === 'audit' && (
          <div className="mt-[-2rem]">
            <AuditPage embedded={true} />
          </div>
        )}

        {hasFullAdminRole && activeTab === 'settings' && <Settings />}
      </div>
    </>
  )
}
