import React from 'react'
import { Modal } from './Modal'
import type { Question } from '../lib/api'

interface AnswerModalProps {
  question: Question | null
  isOpen: boolean
  onClose: () => void
}

export function AnswerModal({ question, isOpen, onClose }: AnswerModalProps) {
  if (!question) return null

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

        {/* Action Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
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
