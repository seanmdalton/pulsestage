import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'

interface TeamContextBarProps {
  teamName: string | null
  teamSlug: string | null
  teamDescription?: string
  showSubmitButton?: boolean
}

// Subtle color schemes for different teams
const teamColors: Record<string, { bg: string; border: string; text: string }> =
  {
    general: {
      bg: 'bg-slate-50 dark:bg-slate-800/30',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-900 dark:text-slate-100',
    },
    engineering: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
    },
    product: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100',
    },
    people: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
    },
    // Default for "All Teams" or unknown teams
    default: {
      bg: 'bg-gray-50 dark:bg-gray-800/30',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-900 dark:text-gray-100',
    },
  }

export function TeamContextBar({
  teamName,
  teamSlug,
  teamDescription,
  showSubmitButton = true,
}: TeamContextBarProps) {
  const navigate = useNavigate()

  // Get color scheme for the team
  const colors = teamSlug
    ? teamColors[teamSlug] || teamColors.default
    : teamColors.default

  // Display name for the context
  const displayName = teamName || 'All Teams'
  const description =
    teamDescription || (teamName ? '' : 'Viewing questions from all teams')

  const handleSubmit = () => {
    if (teamSlug) {
      navigate(`/submit?team=${teamSlug}`)
    } else {
      navigate('/submit')
    }
  }

  return (
    <div
      className={`sticky top-16 z-10 border-b ${colors.bg} ${colors.border} transition-colors`}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2
              className={`text-xl font-semibold ${colors.text} flex items-center gap-2`}
            >
              <span className="text-2xl">📂</span>
              {displayName}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {showSubmitButton && (
            <button
              onClick={handleSubmit}
              className={`
                ml-4 inline-flex items-center gap-2 rounded-md px-4 py-2
                text-sm font-medium text-white shadow-sm
                bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-900
                transition-colors
              `}
              title={
                teamName
                  ? `Submit a question to ${teamName}`
                  : 'Submit a question'
              }
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Submit Question</span>
              <span className="sm:hidden">Submit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
