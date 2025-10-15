import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../lib/api'
import type { Question } from '../lib/api'
import { setFormattedPageTitle } from '../utils/titleUtils'
import { useSSE } from '../hooks/useSSE'
import type { SSEEvent } from '../hooks/useSSE'

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upvoteStatus, setUpvoteStatus] = useState<{
    hasUpvoted: boolean
    canUpvote: boolean
  }>({ hasUpvoted: false, canUpvote: true })

  // Load question data
  useEffect(() => {
    async function loadQuestion() {
      if (!id) {
        setError('No question ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const questionData = await apiClient.getQuestion(id)
        setQuestion(questionData)

        // Load upvote status
        try {
          const status = await apiClient.getUpvoteStatus(id)
          setUpvoteStatus(status)
        } catch (upvoteError) {
          console.error('Failed to load upvote status:', upvoteError)
          // Continue even if upvote status fails
        }

        setError(null)
      } catch (err) {
        console.error('Failed to load question:', err)
        setError(
          'Failed to load question. It may have been deleted or you may not have permission to view it.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadQuestion()
  }, [id])

  // Set page title
  useEffect(() => {
    if (question) {
      const preview =
        question.body.substring(0, 50) +
        (question.body.length > 50 ? '...' : '')
      document.title = `${preview} - PulseStage`
    } else {
      setFormattedPageTitle(undefined, 'question')
    }
  }, [question])

  // Handle SSE events for real-time updates
  const handleSSEEvent = (event: SSEEvent) => {
    if (!question) return

    if (
      event.type === 'question:upvoted' ||
      event.type === 'question:tagged' ||
      event.type === 'question:untagged' ||
      event.type === 'question:answered'
    ) {
      const updatedQuestion = event.data as Question
      if (updatedQuestion.id === question.id) {
        setQuestion(updatedQuestion)
      }
    }
  }

  useSSE({ onEvent: handleSSEEvent })

  // Handle upvote
  const handleUpvote = async () => {
    if (!question || upvoteStatus.hasUpvoted || !upvoteStatus.canUpvote) {
      return
    }

    try {
      const updatedQuestion = await apiClient.upvoteQuestion(question.id)
      setQuestion(updatedQuestion)
      setUpvoteStatus({ hasUpvoted: true, canUpvote: upvoteStatus.canUpvote })
    } catch (error) {
      console.error('Failed to upvote question:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading question...
          </p>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
            Question Not Found
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error || 'The question you are looking for does not exist.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isAnswered = question.status === 'ANSWERED'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        <Link
          to={`/${question.team.slug}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {question.team.name}
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/${question.team.slug}/${isAnswered ? 'answered' : 'open'}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {isAnswered ? 'Answered Questions' : 'Open Questions'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">
          Question Details
        </span>
      </nav>

      {/* Question Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Question Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isAnswered
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                  }`}
                >
                  {isAnswered ? 'Answered' : 'Open'}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Asked {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {question.tags.map((qt) => (
                    <span
                      key={qt.tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    >
                      {qt.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium">
                {question.upvotes} upvote{question.upvotes !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-lg whitespace-pre-wrap">
              {question.body}
            </p>
          </div>
        </div>

        {/* Answer Section (if answered) */}
        {isAnswered && question.responseText && (
          <div className="p-6 bg-green-50 dark:bg-green-900/10 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              Answer
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {question.responseText}
              </p>
            </div>
            {question.respondedAt && (
              <p className="text-sm text-green-700 dark:text-green-300 mt-3">
                Answered on{' '}
                {new Date(question.respondedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Status Section (if open) */}
        {!isAnswered && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Status
                </h4>
                {(() => {
                  const reviewedTag = question.tags?.find(
                    (qt) => qt.tag.name === 'Reviewed'
                  )
                  if (reviewedTag) {
                    const reviewedDate = new Date(
                      reviewedTag.createdAt
                    ).toLocaleDateString()
                    return (
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        This question was reviewed on {reviewedDate} during a
                        presentation session. An answer from the team will be
                        submitted soon.
                      </p>
                    )
                  } else {
                    return (
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        This question is awaiting an answer from the team.
                      </p>
                    )
                  }
                })()}
              </div>
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {question.tags?.find((qt) => qt.tag.name === 'Reviewed')
                    ? 'Reviewed'
                    : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex justify-between items-center">
          <button
            onClick={handleUpvote}
            disabled={upvoteStatus.hasUpvoted || !upvoteStatus.canUpvote}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
              upvoteStatus.hasUpvoted || !upvoteStatus.canUpvote
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-orange-100 dark:bg-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-600'
            }`}
            title={
              !upvoteStatus.canUpvote
                ? 'Cannot upvote your own question'
                : upvoteStatus.hasUpvoted
                  ? 'Already upvoted'
                  : 'Upvote this question'
            }
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            {upvoteStatus.hasUpvoted ? 'Upvoted' : 'Upvote Question'}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
