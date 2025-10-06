import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import type { Question, Tag } from '../lib/api'
import { useTeam } from '../contexts/TeamContext'
import { useUser } from '../contexts/UserContext'
import { ResponseModal } from '../components/ResponseModal'
import { useSSE } from '../hooks/useSSE'
import type { SSEEvent } from '../hooks/useSSE'

export function ModerationQueuePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  )
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'open' | 'answered' | 'all'>(
    'open'
  )
  const [teamFilter, setTeamFilter] = useState<string>('')
  const [pinnedFilter, setPinnedFilter] = useState<
    'all' | 'pinned' | 'unpinned'
  >('all')
  const [frozenFilter, setFrozenFilter] = useState<
    'all' | 'frozen' | 'unfrozen'
  >('all')
  const [needsReviewFilter, setNeedsReviewFilter] = useState(false)
  const [reviewedByFilter, setReviewedByFilter] = useState<string>('')

  const { teams } = useTeam()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { getUserRoleInTeam: _getUserRoleInTeam } = useUser()

  // Handle SSE events
  const handleSSEEvent = (event: SSEEvent) => {
    if (
      [
        'question:created',
        'question:upvoted',
        'question:answered',
        'question:tagged',
        'question:untagged',
        'question:pinned',
        'question:frozen',
      ].includes(event.type)
    ) {
      const updatedQuestion = event.data as Question

      setQuestions((prev) => {
        const existingIndex = prev.findIndex((q) => q.id === updatedQuestion.id)

        if (existingIndex >= 0) {
          // Update existing question
          const newQuestions = [...prev]
          newQuestions[existingIndex] = updatedQuestion
          return newQuestions
        } else if (event.type === 'question:created') {
          // Add new question
          return [updatedQuestion, ...prev]
        }

        return prev
      })
    }
  }

  useSSE({ onEvent: handleSSEEvent })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Load tags
        const tagsData = await apiClient.getTags()
        setAllTags(tagsData)

        // Load questions with filters

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filters: any = {}

        if (statusFilter !== 'all') {
          filters.status = statusFilter
        }

        if (teamFilter) {
          filters.teamId = teamFilter
        }

        if (pinnedFilter === 'pinned') {
          filters.isPinned = true
        } else if (pinnedFilter === 'unpinned') {
          filters.isPinned = false
        }

        if (frozenFilter === 'frozen') {
          filters.isFrozen = true
        } else if (frozenFilter === 'unfrozen') {
          filters.isFrozen = false
        }

        if (needsReviewFilter) {
          filters.needsReview = true
        }

        if (reviewedByFilter) {
          filters.reviewedBy = reviewedByFilter
        }

        const data = await apiClient.getModerationQueue(filters)
        setQuestions(data.questions)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load moderation queue'
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [
    statusFilter,
    teamFilter,
    pinnedFilter,
    frozenFilter,
    needsReviewFilter,
    reviewedByFilter,
  ])

  const handleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set())
    } else {
      setSelectedQuestions(new Set(questions.map((q) => q.id)))
    }
  }

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleBulkAction = async (
    action: 'pin' | 'unpin' | 'freeze' | 'unfreeze' | 'delete'
  ) => {
    if (selectedQuestions.size === 0) return

    if (
      action === 'delete' &&
      !confirm(
        `Are you sure you want to delete ${selectedQuestions.size} question(s)? This cannot be undone.`
      )
    ) {
      return
    }

    try {
      setBulkActionLoading(true)
      await apiClient.bulkActionQuestions(Array.from(selectedQuestions), action)

      // Clear selection
      setSelectedQuestions(new Set())

      // Reload questions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: any = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (teamFilter) filters.teamId = teamFilter

      const data = await apiClient.getModerationQueue(filters)
      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkTag = async (tagId: string, action: 'add' | 'remove') => {
    if (selectedQuestions.size === 0) return

    try {
      setBulkActionLoading(true)
      await apiClient.bulkTagQuestions(
        Array.from(selectedQuestions),
        tagId,
        action
      )

      // Clear selection
      setSelectedQuestions(new Set())

      // Reload questions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: any = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (teamFilter) filters.teamId = teamFilter

      const data = await apiClient.getModerationQueue(filters)
      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk tag operation failed')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleQuickAction = async (
    questionId: string,
    action: 'pin' | 'freeze'
  ) => {
    try {
      let updatedQuestion: Question

      if (action === 'pin') {
        updatedQuestion = await apiClient.pinQuestion(questionId)
      } else {
        updatedQuestion = await apiClient.freezeQuestion(questionId)
      }

      // Update question in state immediately with the API response
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updatedQuestion : q))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Loading moderation queue...
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Moderation Queue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and moderate questions across your teams
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-red-800 dark:text-red-300">{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="answered">Answered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Team
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pinned
              </label>
              <select
                value={pinnedFilter}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setPinnedFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="pinned">Pinned Only</option>
                <option value="unpinned">Unpinned Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frozen
              </label>
              <select
                value={frozenFilter}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setFrozenFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="frozen">Frozen Only</option>
                <option value="unfrozen">Unfrozen Only</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsReviewFilter}
                  onChange={(e) => setNeedsReviewFilter(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Needs Review
                </span>
              </label>
            </div>

            <div className="flex items-end justify-end">
              <button
                onClick={() => {
                  setStatusFilter('open')
                  setTeamFilter('')
                  setPinnedFilter('all')
                  setFrozenFilter('all')
                  setNeedsReviewFilter(false)
                  setReviewedByFilter('')
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedQuestions.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedQuestions.size} question
                {selectedQuestions.size !== 1 ? 's' : ''} selected
              </div>

              <div className="flex items-center space-x-3">
                {/* Bulk Tag Dropdown */}
                <div className="relative inline-block">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const [action, tagId] = e.target.value.split(':')
                        handleBulkTag(tagId, action as 'add' | 'remove')
                        e.target.value = ''
                      }
                    }}
                    disabled={bulkActionLoading}
                    className="px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                  >
                    <option value="">Tag Actions...</option>
                    <optgroup label="Add Tag">
                      {allTags.map((tag) => (
                        <option key={`add-${tag.id}`} value={`add:${tag.id}`}>
                          + {tag.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Remove Tag">
                      {allTags.map((tag) => (
                        <option
                          key={`remove-${tag.id}`}
                          value={`remove:${tag.id}`}
                        >
                          - {tag.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Bulk Actions Dropdown */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      handleBulkAction(e.target.value as any)
                      e.target.value = ''
                    }
                  }}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                >
                  <option value="">Bulk Actions...</option>
                  <option value="pin">📌 Pin All</option>
                  <option value="unpin">📌 Unpin All</option>
                  <option value="freeze">❄️ Freeze All</option>
                  <option value="unfreeze">❄️ Unfreeze All</option>
                  <option value="delete" className="text-red-600">
                    🗑️ Delete All
                  </option>
                </select>

                <button
                  onClick={() => setSelectedQuestions(new Set())}
                  className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        questions.length > 0 &&
                        selectedQuestions.size === questions.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Upvotes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {questions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No questions found matching your filters
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr
                      key={question.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedQuestions.has(question.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.has(question.id)}
                          onChange={() => handleSelectQuestion(question.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          {question.isPinned && (
                            <span
                              className="text-yellow-500 text-lg"
                              title="Pinned"
                            >
                              📌
                            </span>
                          )}
                          {question.isFrozen && (
                            <span
                              className="text-blue-400 text-lg"
                              title="Frozen"
                            >
                              ❄️
                            </span>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {question.body.length > 100
                                ? question.body.substring(0, 100) + '...'
                                : question.body}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Created{' '}
                              {new Date(
                                question.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {question.team?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            question.status === 'ANSWERED'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}
                        >
                          {question.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {question.upvotes}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {question.tags?.slice(0, 3).map((qt) => (
                            <span
                              key={qt.id}
                              className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-white"
                              style={{ backgroundColor: qt.tag.color }}
                            >
                              {qt.tag.name}
                            </span>
                          ))}
                          {question.tags && question.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{question.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleQuickAction(question.id, 'pin')
                            }
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${question.isPinned ? 'text-yellow-500' : 'text-gray-400'}`}
                            title={question.isPinned ? 'Unpin' : 'Pin'}
                          >
                            📌
                          </button>
                          <button
                            onClick={() =>
                              handleQuickAction(question.id, 'freeze')
                            }
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${question.isFrozen ? 'text-blue-400' : 'text-gray-400'}`}
                            title={question.isFrozen ? 'Unfreeze' : 'Freeze'}
                          >
                            ❄️
                          </button>
                          {question.status === 'OPEN' && (
                            <button
                              onClick={() => {
                                setSelectedQuestion(question)
                                setIsModalOpen(true)
                              }}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                              title="Answer"
                            >
                              💬
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
          {selectedQuestions.size > 0 &&
            ` • ${selectedQuestions.size} selected`}
        </div>
      </div>

      {/* Answer Modal */}
      <ResponseModal
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedQuestion(null)
        }}
        onSuccess={() => {
          setIsModalOpen(false)
          setSelectedQuestion(null)
          // Reload questions
          const loadQuestions = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filters: any = {}
            if (statusFilter !== 'all') filters.status = statusFilter
            const data = await apiClient.getModerationQueue(filters)
            setQuestions(data.questions)
          }
          loadQuestions()
        }}
      />
    </>
  )
}
