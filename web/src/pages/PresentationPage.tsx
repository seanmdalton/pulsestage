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

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import type { Question, Tag } from '../lib/api';
import { useUser } from '../contexts/UserContext';
import { useTeamFromUrl } from '../hooks/useTeamFromUrl';
import { PulseStageLogo } from '../components/PulseStageLogo';
import { setFormattedPageTitle } from '../utils/titleUtils';

export function PresentationPage() {
  const { userTeams, getUserRoleInTeam, isLoading } = useUser();
  const { currentTeam } = useTeamFromUrl();
  const navigate = useNavigate();

  // Check if user has admin role in any team
  const hasAdminRole = userTeams.some(team => {
    const role = getUserRoleInTeam(team.id);
    return role === 'admin' || role === 'owner';
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPresentingTag, setCurrentlyPresentingTag] = useState<Tag | null>(null);
  const [reviewedTag, setReviewedTag] = useState<Tag | null>(null);

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'present');
  }, [currentTeam?.slug]);

  // Redirect if not authenticated or doesn't have admin role
  useEffect(() => {
    if (!isLoading && (!hasAdminRole || userTeams.length === 0)) {
      navigate('/admin/login');
    }
  }, [hasAdminRole, userTeams.length, isLoading, navigate]);

  // Load tags (create them if they don't exist)
  useEffect(() => {
    const loadOrCreateTags = async () => {
      try {
        const tags = await apiClient.getTags();
        let currentlyPresentingTag = tags.find(t => t.name === 'Currently Presenting');
        let reviewedTag = tags.find(t => t.name === 'Reviewed');

        // Create "Currently Presenting" tag if it doesn't exist
        if (!currentlyPresentingTag) {
          currentlyPresentingTag = await apiClient.createTag({
            name: 'Currently Presenting',
            description: 'Question currently being presented',
            color: '#10B981' // Green
          });
        }

        // Create "Reviewed" tag if it doesn't exist
        if (!reviewedTag) {
          reviewedTag = await apiClient.createTag({
            name: 'Reviewed',
            description: 'Question has been reviewed',
            color: '#6B7280' // Gray
          });
        }

        setCurrentlyPresentingTag(currentlyPresentingTag);
        setReviewedTag(reviewedTag);
      } catch (err) {
        console.error('Failed to load/create tags:', err);
      }
    };

    if (hasAdminRole) {
      loadOrCreateTags();
    }
  }, [hasAdminRole]);

  // Load questions (filter out reviewed questions)
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await apiClient.getQuestions('OPEN', currentTeam?.id);
        
        // Filter out reviewed questions
        const unreviewedQuestions = data.filter(question => {
          const hasReviewedTag = question.tags?.some(qt => qt.tag.name === 'Reviewed');
          return !hasReviewedTag;
        });
        
        // Sort by upvotes descending to get highest upvoted first
        const sortedQuestions = unreviewedQuestions.sort((a, b) => b.upvotes - a.upvotes);
        setQuestions(sortedQuestions);
        setCurrentQuestionIndex(0);
        
        // Add "Currently Presenting" tag to the first question if we have questions and the tag
        if (sortedQuestions.length > 0 && currentlyPresentingTag) {
          const firstQuestion = sortedQuestions[0];
          const hasCurrentlyPresentingTag = firstQuestion.tags?.some(
            qt => qt.tag.id === currentlyPresentingTag.id
          );
          
          if (!hasCurrentlyPresentingTag) {
            try {
              await apiClient.addTagToQuestion(firstQuestion.id, currentlyPresentingTag.id);
              // Refresh questions to get updated tags
              const updatedData = await apiClient.getQuestions('OPEN', currentTeam?.id);
              const updatedUnreviewedQuestions = updatedData.filter(question => {
                const hasReviewedTag = question.tags?.some(qt => qt.tag.name === 'Reviewed');
                return !hasReviewedTag;
              });
              const updatedSortedQuestions = updatedUnreviewedQuestions.sort((a, b) => b.upvotes - a.upvotes);
              setQuestions(updatedSortedQuestions);
            } catch (err) {
              console.error('Failed to add Currently Presenting tag:', err);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    if (hasAdminRole && currentlyPresentingTag && reviewedTag) {
      loadQuestions();
    }
  }, [hasAdminRole, currentTeam?.id, currentlyPresentingTag, reviewedTag]);

  // Refresh questions periodically to get updated upvotes (but don't auto-move)
  useEffect(() => {
    if (!hasAdminRole) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiClient.getQuestions('OPEN', currentTeam?.id);
        
        // Filter out reviewed questions
        const unreviewedQuestions = data.filter(question => {
          const hasReviewedTag = question.tags?.some(qt => qt.tag.name === 'Reviewed');
          return !hasReviewedTag;
        });
        
        const sortedQuestions = unreviewedQuestions.sort((a, b) => b.upvotes - a.upvotes);
        
        // Try to maintain the current question index
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion) {
          const newIndex = sortedQuestions.findIndex(q => q.id === currentQuestion.id);
          if (newIndex !== -1) {
            // Current question still exists, update the list and maintain index
            setQuestions(sortedQuestions);
            setCurrentQuestionIndex(newIndex);
          } else {
            // Current question was removed (likely marked as reviewed), go to first
            setQuestions(sortedQuestions);
            setCurrentQuestionIndex(0);
          }
        } else {
          setQuestions(sortedQuestions);
        }
      } catch (err) {
        console.error('Failed to refresh questions:', err);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [hasAdminRole, currentTeam?.id, questions, currentQuestionIndex]);

  const advanceToNext = useCallback(async () => {
    if (questions.length === 0 || !currentlyPresentingTag) return;
    
    try {
      // Remove "Currently Presenting" tag from current question and add "Reviewed" tag
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        const hasCurrentlyPresentingTag = currentQuestion.tags?.some(
          qt => qt.tag.id === currentlyPresentingTag.id
        );
        
        if (hasCurrentlyPresentingTag) {
          await apiClient.removeTagFromQuestion(currentQuestion.id, currentlyPresentingTag.id);
        }
        
        // Add "Reviewed" tag to mark this question as covered
        if (reviewedTag) {
          await apiClient.addTagToQuestion(currentQuestion.id, reviewedTag.id);
        }
      }
      
      // Move to next question (wrap around to beginning if at end)
      const newIndex = (currentQuestionIndex + 1) % questions.length;
      setCurrentQuestionIndex(newIndex);
      
      // Add "Currently Presenting" tag to new question
      const newQuestion = questions[newIndex];
      if (newQuestion) {
        await apiClient.addTagToQuestion(newQuestion.id, currentlyPresentingTag.id);
        
        // Refresh questions to get updated tags
        const updatedData = await apiClient.getQuestions('OPEN', currentTeam?.id);
        const updatedUnreviewedQuestions = updatedData.filter(question => {
          const hasReviewedTag = question.tags?.some(qt => qt.tag.name === 'Reviewed');
          return !hasReviewedTag;
        });
        const updatedSortedQuestions = updatedUnreviewedQuestions.sort((a, b) => b.upvotes - a.upvotes);
        setQuestions(updatedSortedQuestions);
        
        // Update the index to point to the correct question in the sorted list
        const correctIndex = updatedSortedQuestions.findIndex(q => q.id === newQuestion.id);
        if (correctIndex !== -1) {
          setCurrentQuestionIndex(correctIndex);
        } else {
          // If the new question was filtered out, go to the first question
          setCurrentQuestionIndex(0);
        }
      }
    } catch (err) {
      console.error('Failed to advance to next question:', err);
    }
  }, [questions, currentQuestionIndex, currentlyPresentingTag, reviewedTag, currentTeam?.id]);

  const goToHighestUpvoted = useCallback(() => {
    if (questions.length === 0) return;
    
    // Since questions are already filtered and sorted, just go to the first one
    setCurrentQuestionIndex(0);
  }, [questions]);

  // Cleanup function to remove "Currently Presenting" tag when exiting
  const cleanupCurrentTag = useCallback(async () => {
    if (!currentlyPresentingTag || questions.length === 0) return;
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        const hasCurrentlyPresentingTag = currentQuestion.tags?.some(
          qt => qt.tag.id === currentlyPresentingTag.id
        );
        
        if (hasCurrentlyPresentingTag) {
          await apiClient.removeTagFromQuestion(currentQuestion.id, currentlyPresentingTag.id);
        }
      }
    } catch (err) {
      console.error('Failed to cleanup current tag:', err);
    }
  }, [questions, currentQuestionIndex, currentlyPresentingTag]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts (user navigates away)
      cleanupCurrentTag();
    };
  }, [cleanupCurrentTag]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in input fields
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          advanceToNext();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          goToHighestUpvoted();
          break;
        case 'Escape':
          e.preventDefault();
          cleanupCurrentTag().then(() => {
            navigate(-1); // Go back to previous page after cleanup
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [advanceToNext, goToHighestUpvoted, cleanupCurrentTag, navigate]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading presentation mode...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-2xl">Error: {error}</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-4xl mb-4">No Questions Available</div>
          <div className="text-gray-400 text-xl">No open questions to present</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with minimal controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <PulseStageLogo size="sm" showWordmark={true} className="text-white" />
          <div className="text-sm text-gray-400">
            {currentTeam ? currentTeam.name : 'All Teams'} • Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-sm text-gray-400">
            Space/Enter: Next • H: Highest Unreviewed • Esc: Exit
          </div>
          <button
            onClick={() => {
              cleanupCurrentTag().then(() => {
                navigate(-1);
              });
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

          {/* Currently presenting indicator */}
          <div className="mt-8">
            <div 
              className="inline-block px-6 py-3 text-white rounded-full text-lg font-medium"
              style={{ backgroundColor: currentlyPresentingTag?.color || '#10B981' }}
            >
              {currentlyPresentingTag?.name || 'Currently Presenting'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
