import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { setFormattedPageTitle } from '../utils/titleUtils'

type Scale = 'LIKERT_1_5' | 'NPS_0_10'

export function PulseRespondPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme, colorMode } = useTheme()
  const themeColors = colorMode === 'light' ? theme.light : theme.dark

  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [pendingInvites, setPendingInvites] = useState<string[]>([])
  const [currentInviteIndex, setCurrentInviteIndex] = useState(0)

  useEffect(() => {
    setFormattedPageTitle(undefined, 'pulse-respond')
  }, [])

  // Load all pending invites for this user
  useEffect(() => {
    const loadPendingInvites = async () => {
      try {
        const response = await fetch('http://localhost:3000/pulse/my-invites', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const tokens = data.invites.map((inv: { token: string }) => inv.token)
          setPendingInvites(tokens)

          // Find current token's index
          if (token) {
            const index = tokens.indexOf(token)
            if (index >= 0) {
              setCurrentInviteIndex(index)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load pending invites:', err)
      }
    }

    loadPendingInvites()
  }, [token])

  // Load invite details
  useEffect(() => {
    if (!token) {
      setError('No invite token provided')
      setLoading(false)
      return
    }

    // For now, we'll need to get invite details from the token
    // In a real implementation, we'd have an API endpoint to get invite details
    setLoading(false)
  }, [token])

  const handleSubmit = async (score: number) => {
    if (!token) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('http://localhost:3000/pulse/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          score,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || 'Failed to submit response'
        )
      }

      setSubmitted(true)

      // Check if there are more pending invites
      const nextIndex = currentInviteIndex + 1
      if (nextIndex < pendingInvites.length) {
        // Navigate to next invite after a brief delay
        setTimeout(() => {
          const nextToken = pendingInvites[nextIndex]
          navigate(`/pulse/respond?token=${nextToken}`)
          // Reset state for next pulse
          setSubmitted(false)
          setSelectedScore(null)
          setCurrentInviteIndex(nextIndex)
        }, 1500)
      } else {
        // No more invites, redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/all/dashboard')
        }, 2000)
      }
    } catch (err) {
      console.error('Error submitting pulse response:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  const getLikertLabel = (score: number): string => {
    const labels = {
      1: 'Very Dissatisfied',
      2: 'Dissatisfied',
      3: 'Neutral',
      4: 'Satisfied',
      5: 'Very Satisfied',
    }
    return labels[score as keyof typeof labels] || ''
  }

  const getLikertEmoji = (score: number): string => {
    const emojis = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😊' }
    return emojis[score as keyof typeof emojis] || ''
  }

  const getLikertColor = (score: number): string => {
    const colors = {
      1: '#ef4444',
      2: '#f97316',
      3: '#eab308',
      4: '#84cc16',
      5: '#22c55e',
    }
    return colors[score as keyof typeof colors] || themeColors.primary
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This pulse response link is invalid or missing a token.
          </p>
          <button
            onClick={() => navigate('/all/dashboard')}
            className="px-6 py-2 text-white font-medium rounded-md shadow-sm transition-colors"
            style={{ backgroundColor: themeColors.primary }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    const nextIndex = currentInviteIndex + 1
    const hasMore = nextIndex < pendingInvites.length
    const totalInvites = pendingInvites.length
    const completed = currentInviteIndex + 1

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Thank You!
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Your response has been recorded.
          </p>
          {totalInvites > 1 && (
            <div
              className="text-lg font-semibold mb-4"
              style={{ color: themeColors.primary }}
            >
              {hasMore
                ? `✨ ${completed} of ${totalInvites} complete - Loading next...`
                : `🎉 All ${totalInvites} pulses complete!`}
            </div>
          )}
          <div
            className="p-4 rounded-lg mb-6"
            style={{ backgroundColor: `${themeColors.primary}10` }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔒 Your feedback helps us build a better workplace. Individual
              responses are anonymous and never shared.
            </p>
          </div>
          {!hasMore && (
            <button
              onClick={() => navigate('/all/dashboard')}
              className="px-6 py-2 text-white font-medium rounded-md shadow-sm transition-colors"
              style={{ backgroundColor: themeColors.primary }}
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/all/dashboard')}
            className="px-6 py-2 text-white font-medium rounded-md shadow-sm transition-colors"
            style={{ backgroundColor: themeColors.primary }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // For now, show a generic pulse question interface
  // In production, we'd fetch the actual question from the token
  const questionText = "How's your week going?"
  const scale: Scale = 'LIKERT_1_5'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div
          className="rounded-lg shadow-lg border p-8"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">💙</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Your Weekly Pulse
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Take 5 seconds to share how you're feeling
            </p>
          </div>

          {/* Question */}
          <div
            className="p-6 rounded-lg mb-6 border-l-4"
            style={{
              backgroundColor: `${themeColors.primary}10`,
              borderLeftColor: themeColors.primary,
            }}
          >
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {questionText}
            </p>
          </div>

          {/* Rating Buttons */}
          <div className="flex justify-center gap-3 mb-8">
            {scale === 'LIKERT_1_5' &&
              [1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => {
                    setSelectedScore(score)
                    handleSubmit(score)
                  }}
                  disabled={submitting}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      selectedScore === score ? getLikertColor(score) : 'white',
                    borderColor: getLikertColor(score),
                    color:
                      selectedScore === score ? 'white' : getLikertColor(score),
                  }}
                  title={getLikertLabel(score)}
                >
                  <span className="text-3xl mb-1">{getLikertEmoji(score)}</span>
                  <span className="text-sm font-semibold">{score}</span>
                </button>
              ))}
          </div>

          {/* Privacy Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              🔒 <strong>Your response is anonymous.</strong> Individual
              responses are never shared. Only aggregated data (5+ responses) is
              shown to protect privacy.
            </p>
          </div>

          {submitting && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Submitting...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
