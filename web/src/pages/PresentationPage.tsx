/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api'
import type { Question, Tag } from '../lib/api'
import { useUser } from '../contexts/UserContext'
import { useTeamFromUrl } from '../hooks/useTeamFromUrl'
import { PulseStageLogo } from '../components/PulseStageLogo'
import { setFormattedPageTitle } from '../utils/titleUtils'
import { useSSE } from '../hooks/useSSE'
import type { SSEEvent } from '../hooks/useSSE'

export function PresentationPage() {
  const { userTeams, getUserRoleInTeam, isLoading } = useUser()
  const { currentTeam } = useTeamFromUrl()
  const navigate = useNavigate()

  // Check if user has moderator role or higher in the CURRENT team context
  // If viewing all teams, check if they have the role in ANY team
  const hasAdminRole = currentTeam
    ? (() => {
        const role = getUserRoleInTeam(currentTeam.id)
        return role === 'moderator' || role === 'admin' || role === 'owner'
      })()
    : userTeams.some((team) => {
        const role = getUserRoleInTeam(team.id)
        return role === 'moderator' || role === 'admin' || role === 'owner'
      })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentlyPresentingTag, setCurrentlyPresentingTag] =
    useState<Tag | null>(null)
  const [reviewedTag, setReviewedTag] = useState<Tag | null>(null)

  // Refs to capture latest values for cleanup on unmount
  const currentQuestionIdRef = useRef<string | null>(null)
  const currentlyPresentingTagRef = useRef<Tag | null>(null)

  // Keep refs in sync with state
  useEffect(() => {
    currentQuestionIdRef.current = currentQuestionId
  }, [currentQuestionId])

  useEffect(() => {
    currentlyPresentingTagRef.current = currentlyPresentingTag
  }, [currentlyPresentingTag])

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'present')
  }, [currentTeam?.slug])

  // Redirect if not authenticated or doesn't have admin role
  useEffect(() => {
    if (!isLoading && (!hasAdminRole || userTeams.length === 0)) {
      navigate('/admin/login')
    }
  }, [hasAdminRole, userTeams.length, isLoading, navigate])

  // Handle SSE events for real-time updates in presentation mode
  const handleSSEEvent = (event: SSEEvent) => {
    if (
      event.type === 'question:upvoted' ||
      event.type === 'question:tagged' ||
      event.type === 'question:untagged'
    ) {
      const updatedQuestion = event.data as Question

      // Update question in list if it's still OPEN and not reviewed
      if (updatedQuestion.status === 'OPEN') {
        const hasReviewedTag = updatedQuestion.tags?.some(
          (qt) => qt.tag.name === 'Reviewed'
        )
        const matchesTeamFilter =
          !currentTeam || updatedQuestion.teamId === currentTeam.id

        if (!hasReviewedTag && matchesTeamFilter) {
          setQuestions((prev) => {
            const existingIndex = prev.findIndex(
              (q) => q.id === updatedQuestion.id
            )

            if (existingIndex >= 0) {
              // Update existing question - DON'T re-sort to maintain stable presentation order
              const newQuestions = [...prev]
              newQuestions[existingIndex] = updatedQuestion
              return newQuestions
            }

            return prev
          })
        }
      }
    } else if (event.type === 'question:created') {
      // Add new question if it matches filters (at the end, don't disrupt presentation)
      const newQuestion = event.data as Question
      const matchesTeamFilter =
        !currentTeam || newQuestion.teamId === currentTeam.id

      if (newQuestion.status === 'OPEN' && matchesTeamFilter) {
        setQuestions((prev) => [...prev, newQuestion])
      }
    }
  }

  // Connect to SSE for real-time updates
  useSSE({
    onEvent: handleSSEEvent,
  })

  // Load tags (create them if they don't exist)
  useEffect(() => {
    const loadOrCreateTags = async () => {
      try {
        const tags = await apiClient.getTags()
        let currentlyPresentingTag = tags.find(
          (t) => t.name === 'Currently Presenting'
        )
        let reviewedTag = tags.find((t) => t.name === 'Reviewed')

        // Create "Currently Presenting" tag if it doesn't exist
        if (!currentlyPresentingTag) {
          try {
            currentlyPresentingTag = await apiClient.createTag({
              name: 'Currently Presenting',
              description: 'Question currently being presented',
              color: '#10B981', // Green
            })
          } catch (createError: any) {
            // Tag might have been created by another process, refetch
            const tagsRetry = await apiClient.getTags()
            currentlyPresentingTag = tagsRetry.find(
              (t) => t.name === 'Currently Presenting'
            )
            if (!currentlyPresentingTag) {
              throw createError // Re-throw if still not found
            }
          }
        }

        // Create "Reviewed" tag if it doesn't exist
        if (!reviewedTag) {
          try {
            reviewedTag = await apiClient.createTag({
              name: 'Reviewed',
              description: 'Question has been reviewed',
              color: '#6B7280', // Gray
            })
          } catch (createError: any) {
            // Tag might have been created by another process, refetch
            const tagsRetry = await apiClient.getTags()
            reviewedTag = tagsRetry.find((t) => t.name === 'Reviewed')
            if (!reviewedTag) {
              throw createError // Re-throw if still not found
            }
          }
        }

        setCurrentlyPresentingTag(currentlyPresentingTag)
        setReviewedTag(reviewedTag)
      } catch (err) {
        console.error('Failed to load/create tags:', err)
      }
    }

    if (hasAdminRole) {
      loadOrCreateTags()
    }
  }, [hasAdminRole])

  // Load questions (filter out reviewed questions)
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await apiClient.getQuestions('OPEN', currentTeam?.id)

        // Filter out reviewed questions
        const unreviewedQuestions = data.filter((question) => {
          const hasReviewedTag = question.tags?.some(
            (qt) => qt.tag.name === 'Reviewed'
          )
          return !hasReviewedTag
        })

        // Sort by upvotes descending to get highest upvoted first
        const sortedQuestions = unreviewedQuestions.sort(
          (a, b) => b.upvotes - a.upvotes
        )
        setQuestions(sortedQuestions)

        // Set current question to the first one
        if (sortedQuestions.length > 0 && !currentQuestionId) {
          const firstQuestion = sortedQuestions[0]
          setCurrentQuestionId(firstQuestion.id)

          // Add "Currently Presenting" tag to the first question
          if (currentlyPresentingTag) {
            const hasCurrentlyPresentingTag = firstQuestion.tags?.some(
              (qt) => qt.tag.id === currentlyPresentingTag.id
            )

            if (!hasCurrentlyPresentingTag) {
              try {
                await apiClient.addTagToQuestion(
                  firstQuestion.id,
                  currentlyPresentingTag.id
                )
                // Update the question in state with the new tag
                const updatedData = await apiClient.getQuestions(
                  'OPEN',
                  currentTeam?.id
                )
                const updatedUnreviewedQuestions = updatedData.filter(
                  (question) => {
                    const hasReviewedTag = question.tags?.some(
                      (qt) => qt.tag.name === 'Reviewed'
                    )
                    return !hasReviewedTag
                  }
                )
                const updatedSortedQuestions = updatedUnreviewedQuestions.sort(
                  (a, b) => b.upvotes - a.upvotes
                )
                setQuestions(updatedSortedQuestions)
              } catch (err) {
                console.error('Failed to add Currently Presenting tag:', err)
              }
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load questions'
        )
      } finally {
        setLoading(false)
      }
    }

    if (hasAdminRole && currentlyPresentingTag && reviewedTag) {
      loadQuestions()
    }
  }, [
    hasAdminRole,
    currentTeam?.id,
    currentlyPresentingTag,
    reviewedTag,
    currentQuestionId,
  ])

  // SSE will handle real-time updates, no need for periodic refresh

  const advanceToNext = useCallback(async () => {
    if (questions.length === 0 || !currentlyPresentingTag || !currentQuestionId)
      return

    try {
      // Find current question
      const currentIndex = questions.findIndex(
        (q) => q.id === currentQuestionId
      )
      if (currentIndex === -1) return

      const currentQuestion = questions[currentIndex]

      // Remove "Currently Presenting" tag and add "Reviewed" tag
      const hasCurrentlyPresentingTag = currentQuestion.tags?.some(
        (qt) => qt.tag.id === currentlyPresentingTag.id
      )

      if (hasCurrentlyPresentingTag) {
        await apiClient.removeTagFromQuestion(
          currentQuestion.id,
          currentlyPresentingTag.id
        )
      }

      if (reviewedTag) {
        await apiClient.addTagToQuestion(currentQuestion.id, reviewedTag.id)
      }

      // Move to next question (wrap around)
      const nextIndex = (currentIndex + 1) % questions.length
      const nextQuestion = questions[nextIndex]

      // Add "Currently Presenting" tag to new question
      await apiClient.addTagToQuestion(
        nextQuestion.id,
        currentlyPresentingTag.id
      )
      setCurrentQuestionId(nextQuestion.id)

      // Note: SSE will update the question tags in state automatically
    } catch (err) {
      console.error('Failed to advance to next question:', err)
    }
  }, [questions, currentQuestionId, currentlyPresentingTag, reviewedTag])

  const goToHighestUpvoted = useCallback(() => {
    if (questions.length === 0) return

    // Since questions are already filtered and sorted, just go to the first one
    setCurrentQuestionId(questions[0].id)
  }, [questions])

  // Cleanup function to remove "Currently Presenting" tag when exiting
  const cleanupCurrentTag = useCallback(async () => {
    if (!currentlyPresentingTag || !currentQuestionId) return

    try {
      const currentQuestion = questions.find((q) => q.id === currentQuestionId)
      if (currentQuestion) {
        const hasCurrentlyPresentingTag = currentQuestion.tags?.some(
          (qt) => qt.tag.id === currentlyPresentingTag.id
        )

        if (hasCurrentlyPresentingTag) {
          await apiClient.removeTagFromQuestion(
            currentQuestion.id,
            currentlyPresentingTag.id
          )
        }
      }
    } catch (err) {
      console.error('Failed to cleanup current tag:', err)
    }
  }, [questions, currentQuestionId, currentlyPresentingTag])

  // Cleanup on component unmount ONLY (not on re-renders)
  useEffect(() => {
    return () => {
      // This cleanup ONLY runs when the component actually unmounts
      // Use refs to get the latest values without re-running the effect
      const questionId = currentQuestionIdRef.current
      const presentingTag = currentlyPresentingTagRef.current

      if (questionId && presentingTag) {
        // Run cleanup asynchronously (fire and forget on unmount)
        apiClient
          .removeTagFromQuestion(questionId, presentingTag.id)
          .catch((err) => {
            console.error('Failed to cleanup tag on unmount:', err)
          })
      }
    }
  }, []) // Empty deps = only runs on mount/unmount, uses refs for latest values

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return // Don't handle shortcuts when typing in input fields
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          advanceToNext()
          break
        case 'h':
        case 'H':
          e.preventDefault()
          goToHighestUpvoted()
          break
        case 'Escape':
          e.preventDefault()
          cleanupCurrentTag().then(() => {
            navigate(-1) // Go back to previous page after cleanup
          })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [advanceToNext, goToHighestUpvoted, cleanupCurrentTag, navigate])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading presentation mode...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-2xl">Error: {error}</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-4xl mb-4">No Questions Available</div>
          <div className="text-gray-400 text-xl">
            No open questions to present
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions.find((q) => q.id === currentQuestionId)
  const currentQuestionIndex = currentQuestion
    ? questions.findIndex((q) => q.id === currentQuestionId)
    : 0

  // Safety check
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading question...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with minimal controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <PulseStageLogo
            size="sm"
            showWordmark={true}
            forceTheme="dark"
            className="text-white"
          />
          <div className="text-sm text-gray-400">
            {currentTeam ? currentTeam.name : 'All Teams'} • Question{' '}
            {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-sm text-gray-400">
            Space/Enter: Next • H: Highest Unreviewed • Esc: Exit
          </div>
          <button
            onClick={() => {
              cleanupCurrentTag().then(() => {
                navigate(-1)
              })
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main question display */}
      <div className="flex items-center justify-center min-h-screen px-8 pt-16 pb-8">
        <div className="max-w-5xl w-full text-center">
          {/* Upvote count */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-blue-400">
              {currentQuestion.upvotes}
            </div>
            <div className="text-xl text-gray-400">
              upvote{currentQuestion.upvotes !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Question text with scrollable container */}
          <div className="relative max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {/* Fade overlay at top */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-900 to-transparent z-10 pointer-events-none"></div>

            {/* Fade overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent z-10 pointer-events-none"></div>

            {/* Question text */}
            <div className="text-3xl md:text-4xl lg:text-5xl font-medium leading-relaxed text-white px-4 py-8">
              {currentQuestion.body}
            </div>
          </div>

          {/* Question Tags */}
          {currentQuestion.tags && currentQuestion.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {currentQuestion.tags.map((questionTag) => (
                <span
                  key={questionTag.id}
                  className="inline-block px-5 py-2 text-white rounded-full text-base font-medium shadow-lg"
                  style={{ backgroundColor: questionTag.tag.color }}
                >
                  {questionTag.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
