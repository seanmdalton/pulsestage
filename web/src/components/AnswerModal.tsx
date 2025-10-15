import { useState } from 'react'
import { Modal } from './Modal'
import type { Question } from '../lib/api'

interface AnswerModalProps {
  question: Question | null
  isOpen: boolean
  onClose: () => void
}

export function AnswerModal({ question, isOpen, onClose }: AnswerModalProps) {
  const [copied, setCopied] = useState(false)

  if (!question) return null

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
    <Modal isOpen={isOpen} onClose={onClose} title="Question & Answer">
      <div className="p-6">
        {/* Question Section */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Question
            </h3>
            <div className="flex items-center space-x-3 text-sm text-blue-700 dark:text-blue-300">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium">
                {question.upvotes} upvote{question.upvotes !== 1 ? 's' : ''}
              </span>
              <span>
                Asked {new Date(question.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <p className="text-blue-900 dark:text-blue-100 leading-relaxed text-base">
            {question.body}
          </p>
        </div>

        {/* Answer Section */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Answer
            </h3>
            <div className="text-sm text-green-700 dark:text-green-300">
              Answered{' '}
              {question.respondedAt
                ? new Date(question.respondedAt).toLocaleDateString()
                : 'Unknown'}
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-green-900 dark:text-green-100 leading-relaxed text-base whitespace-pre-wrap">
              {question.responseText}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
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

          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
