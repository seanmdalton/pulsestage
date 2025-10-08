import React, { useState } from 'react'
import { Modal } from './Modal'
import type { Question } from '../lib/api'

interface QuestionModalProps {
  question: Question | null
  isOpen: boolean
  onClose: () => void
  onUpvote: (questionId: string) => void
  upvotedQuestions: Set<string>
  upvoteStatus?: Map<string, { hasUpvoted: boolean; canUpvote: boolean }>
}

export function QuestionModal({
  question,
  isOpen,
  onClose,
  onUpvote,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  upvotedQuestions: _upvotedQuestions,
  upvoteStatus = new Map(),
}: QuestionModalProps) {
  const [copied, setCopied] = useState(false)

  if (!question) return null

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpvote(question.id)
  }

  const handleCopyLink = async () => {
    const questionUrl = `${window.location.origin}/questions/${question.id}`
    try {
      await navigator.clipboard.writeText(questionUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Question Details">
      <div className="p-6">
        {/* Question Section */}
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
              Open Question
            </h3>
            <div className="flex items-center space-x-3 text-sm text-orange-700 dark:text-orange-300">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-sm font-medium">
                {question.upvotes} upvote{question.upvotes !== 1 ? 's' : ''}
              </span>
              <span>
                Asked {new Date(question.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-orange-900 dark:text-orange-100 leading-relaxed text-base whitespace-pre-wrap">
              {question.body}
            </p>
          </div>
        </div>

        {/* Status Section */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            {(() => {
              const status = upvoteStatus.get(question.id)
              const hasUpvoted = status?.hasUpvoted || false
              const canUpvote = status?.canUpvote ?? true

              return (
                <button
                  onClick={handleUpvote}
                  disabled={hasUpvoted || !canUpvote}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                    hasUpvoted || !canUpvote
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-orange-100 dark:bg-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-600'
                  }`}
                  title={
                    !canUpvote
                      ? 'Cannot upvote your own question'
                      : hasUpvoted
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
                  {hasUpvoted ? 'Upvoted' : 'Upvote Question'}
                </button>
              )
            })()}

            <button
              onClick={handleCopyLink}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                copied
                  ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-300'
                  : 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-600'
              }`}
              title="Copy link to this question"
            >
              {copied ? (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
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
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Close
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            💡 Upvote questions you'd like to see answered to help prioritize
            responses
          </p>
        </div>
      </div>
    </Modal>
  )
}
