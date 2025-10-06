import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { apiClient } from '../lib/api'
import type { Question } from '../lib/api'

interface Tag {
  id: string
  name: string
  color: string
}

interface ResponseModalProps {
  question: Question | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedQuestion: Question) => void
}

export function ResponseModal({
  question,
  isOpen,
  onClose,
  onSuccess,
}: ResponseModalProps) {
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [loadingTags, setLoadingTags] = useState(false)

  // Load tags when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  // Reset form when modal opens/closes or question changes
  useEffect(() => {
    if (isOpen && question) {
      setResponse('')
      setError(null)
      // Pre-select existing tags
      const existingTagIds = new Set(
        question.tags?.map((qt) => qt.tag.id) || []
      )
      setSelectedTags(existingTagIds)
    }
  }, [isOpen, question])

  const loadTags = async () => {
    try {
      setLoadingTags(true)
      const tagsData = await apiClient.getTags()
      setTags(tagsData)
    } catch (err) {
      console.error('Failed to load tags:', err)
    } finally {
      setLoadingTags(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tagId)) {
        newSet.delete(tagId)
      } else {
        newSet.add(tagId)
      }
      return newSet
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question || !response.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Submit the response
      let updatedQuestion = await apiClient.respondToQuestionWithSession(
        question.id,
        { response: response.trim() }
      )

      // Manage tags (add/remove)
      const existingTagIds = new Set(
        question.tags?.map((qt) => qt.tag.id) || []
      )
      const tagsToAdd = Array.from(selectedTags).filter(
        (id) => !existingTagIds.has(id)
      )
      const tagsToRemove = Array.from(existingTagIds).filter(
        (id) => !selectedTags.has(id)
      )

      // Add new tags
      for (const tagId of tagsToAdd) {
        await apiClient.addTagToQuestion(question.id, tagId)
      }

      // Remove unselected tags
      for (const tagId of tagsToRemove) {
        await apiClient.removeTagFromQuestion(question.id, tagId)
      }

      // Reload question to get updated tags
      if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
        const questions = await apiClient.getQuestions('ANSWERED')
        updatedQuestion =
          questions.find((q) => q.id === question.id) || updatedQuestion
      }

      onSuccess(updatedQuestion)
      onClose()
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('authentication required')
      ) {
        setError(
          'Your session has expired. Please refresh the page and log in again.'
        )
      } else {
        setError(
          error instanceof Error ? error.message : 'Failed to submit response'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!question) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Respond to Question">
      <div className="p-6">
        {/* Question Display */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Question
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{question.upvotes} upvotes</span>
              <span>{new Date(question.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {question.body}
          </p>
        </div>

        {/* Response Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tags Section */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    disabled={isSubmitting}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedTags.has(tag.id)
                        ? 'text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tag.color,
                      opacity: selectedTags.has(tag.id) ? 1 : 0.6,
                    }}
                  >
                    {selectedTags.has(tag.id) && (
                      <svg
                        className="w-3 h-3 inline-block mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {tag.name}
                  </button>
                ))}
              </div>
              {loadingTags && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Loading tags...
                </div>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="response"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Response
            </label>
            <textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your detailed response..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={8}
              maxLength={10000}
              disabled={isSubmitting}
              required
            />
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-right">
              {response.length}/10000 characters
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!response.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Submitting...
                </>
              ) : (
                'Submit Response'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
