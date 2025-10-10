/**
 * Login Page
 *
 * Standalone login page that redirects to AuthSelector
 * or displays authentication options directly
 */

import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AuthSelector } from '../components/AuthSelector'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    // Set page title
    document.title = 'Sign In - PulseStage'
  }, [])

  return (
    <div>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Authentication Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <AuthSelector />
    </div>
  )
}
