import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../contexts/AdminContext'
import { useUser } from '../contexts/UserContext'
import { setFormattedPageTitle } from '../utils/titleUtils'

export function AdminLoginPage() {
  const [adminKey, setAdminKey] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAdmin()
  const { userTeams, getUserRoleInTeam } = useUser()

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(undefined, 'login')
  }, [])

  // Check if user has admin privileges and redirect accordingly
  useEffect(() => {
    const hasAdminRole = userTeams.some((team) => {
      const role = getUserRoleInTeam(team.id)
      return role === 'admin' || role === 'owner'
    })

    if (userTeams.length > 0) {
      if (hasAdminRole) {
        // User has admin role, redirect directly to admin panel
        navigate('/admin', { replace: true })
      } else {
        // User is authenticated but doesn't have admin role
        navigate('/all', { replace: true })
      }
    }
  }, [userTeams, getUserRoleInTeam, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) return

    setIsLoggingIn(true)
    setError(null)

    try {
      await login(adminKey.trim())
      // Redirect to admin page on successful login
      navigate('/admin')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Check if user has admin role
  const hasAdminRole = userTeams.some((team) => {
    const role = getUserRoleInTeam(team.id)
    return role === 'admin' || role === 'owner'
  })

  // Show access denied message for non-admin users
  if (userTeams.length > 0 && !hasAdminRole) {
    return (
      <div className="min-h-screen flex justify-center bg-gray-50 dark:bg-gray-900 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              You don't have admin privileges to access this page. Admin access
              is restricted to team administrators and owners.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 dark:bg-gray-900 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your admin key to access the admin panel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="admin-key" className="sr-only">
              Admin Key
            </label>
            <input
              id="admin-key"
              name="admin-key"
              type="password"
              required
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Admin key"
              disabled={isLoggingIn}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!adminKey.trim() || isLoggingIn}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 transition-colors"
            >
              {isLoggingIn ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm"
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    </div>
  )
}
