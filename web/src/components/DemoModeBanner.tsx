/**
 * Demo Mode Banner
 *
 * Displays a banner when user is in demo mode to inform them
 * that data resets daily and to encourage signing up
 */

import { useState, useMemo } from 'react'
import { useUser } from '../contexts/UserContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Check URL for demo query param once (outside component to avoid re-evaluation)
const checkDemoFromUrl = () => {
  if (typeof window === 'undefined') return false

  const urlParams = new URLSearchParams(window.location.search)
  const hasDemo = urlParams.get('demo') === 'true'

  if (hasDemo) {
    // Clean up URL
    window.history.replaceState({}, '', window.location.pathname)
  }

  return hasDemo
}

const demoFromUrl = checkDemoFromUrl()

export function DemoModeBanner() {
  const { user } = useUser()
  const [isVisible, setIsVisible] = useState(true)

  // Derive isDemoMode from user email or URL param
  const isDemoMode = useMemo(() => {
    return (
      (user?.email && user.email.endsWith('@demo.pulsestage.dev')) ||
      demoFromUrl
    )
  }, [user?.email])

  if (!isDemoMode || !isVisible) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1 min-w-0">
            <span className="flex p-2 rounded-lg bg-blue-800">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium text-sm truncate">
              <span className="inline">
                You're in <span className="font-semibold">demo mode</span>. Data
                resets daily.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <a
              href={`${API_URL}/auth/github`}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Sign up to save your work
            </a>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="-mr-1 flex p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
