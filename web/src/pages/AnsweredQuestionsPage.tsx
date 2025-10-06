import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import type { Question } from '../lib/api'
import { groupQuestionsByWeek } from '../utils/dateUtils'
import { AnswerModal } from '../components/AnswerModal'
import { useTeamFromUrl } from '../hooks/useTeamFromUrl'
import { getTeamDisplayName } from '../contexts/TeamContext'
import { setFormattedPageTitle } from '../utils/titleUtils'
import {
  QuestionFilters,
  type FilterState,
} from '../components/QuestionFilters'

export function AnsweredQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})

  const { currentTeam } = useTeamFromUrl()

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'answered')
  }, [currentTeam?.slug])

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await apiClient.getQuestions(
          'ANSWERED',
          currentTeam?.id,
          filters
        )
        setQuestions(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load questions'
        )
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [currentTeam?.id, filters])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Answered Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Viewing:{' '}
            <span className="font-medium">
              {getTeamDisplayName(currentTeam)}
            </span>
          </p>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Loading questions...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Answered Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Viewing:{' '}
            <span className="font-medium">
              {getTeamDisplayName(currentTeam)}
            </span>
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
      </div>
    )
  }

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedQuestion(null)
  }

  const weeklyGroups = groupQuestionsByWeek(questions)

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Answered Questions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {questions.length} question{questions.length !== 1 ? 's' : ''}{' '}
              answered
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Viewing:{' '}
              <span className="font-medium">
                {getTeamDisplayName(currentTeam)}
              </span>
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <QuestionFilters onFilterChange={setFilters} currentFilters={filters} />

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              📝 No answered questions yet
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              Questions will appear here once they're answered.
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {weeklyGroups.map((group, groupIndex) => (
              <div key={group.weekStart.toISOString()}>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {group.weekLabel}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {group.questions.length} question
                    {group.questions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.questions.map((question) => (
                    <div
                      key={question.id}
                      className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer"
                      onClick={() => handleQuestionClick(question)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                            {question.upvotes} upvote
                            {question.upvotes !== 1 ? 's' : ''}
                          </span>
                          <span>
                            {question.respondedAt
                              ? new Date(
                                  question.respondedAt
                                ).toLocaleDateString()
                              : new Date(
                                  question.createdAt
                                ).toLocaleDateString()}
                          </span>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>

                      {/* Tags */}
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {question.tags.map((questionTag) => (
                            <span
                              key={questionTag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: questionTag.tag.color }}
                            >
                              {questionTag.tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Question
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 leading-relaxed">
                          {question.body}
                        </p>
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Answer
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed mb-3">
                          {question.responseText}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Answered{' '}
                            {question.respondedAt
                              ? new Date(
                                  question.respondedAt
                                ).toLocaleDateString()
                              : 'Unknown'}
                          </div>
                          <button className="text-xs text-green-600 dark:text-green-400 font-medium group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors flex items-center">
                            Read More
                            <svg
                              className="w-3 h-3 ml-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer Modal */}
      <AnswerModal
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
}
