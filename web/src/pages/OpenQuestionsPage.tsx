import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';
import { QuestionModal } from '../components/QuestionModal';
import { useTeamFromUrl } from '../hooks/useTeamFromUrl';
import { getTeamDisplayName } from '../contexts/TeamContext';
import { setFormattedPageTitle } from '../utils/titleUtils';
import { useAdmin } from '../contexts/AdminContext';

export function OpenQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentTeam } = useTeamFromUrl();
  const { isAuthenticated } = useAdmin();
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(currentTeam?.slug, 'open');
  }, [currentTeam?.slug]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await apiClient.getQuestions('OPEN', currentTeam?.id);
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();

    // Load upvoted questions from localStorage
    const stored = localStorage.getItem('upvotedQuestions');
    if (stored) {
      try {
        setUpvotedQuestions(new Set(JSON.parse(stored)));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [currentTeam?.id]);

  const handleUpvote = async (questionId: string) => {
    if (upvotedQuestions.has(questionId)) return;

    try {
      const updatedQuestion = await apiClient.upvoteQuestion(questionId);
      setQuestions(prev => 
        prev.map(q => q.id === questionId ? updatedQuestion : q)
      );
      
      // Mark as upvoted
      const newUpvoted = new Set(upvotedQuestions);
      newUpvoted.add(questionId);
      setUpvotedQuestions(newUpvoted);
      localStorage.setItem('upvotedQuestions', JSON.stringify([...newUpvoted]));
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Open Questions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Viewing: <span className="font-medium">{getTeamDisplayName(currentTeam)}</span>
          </p>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Open Questions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Viewing: <span className="font-medium">{getTeamDisplayName(currentTeam)}</span>
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Open Questions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''} awaiting answers
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Viewing: <span className="font-medium">{getTeamDisplayName(currentTeam)}</span>
          </p>
        </div>
        {isAuthenticated && questions.length > 0 && (
          <button
            onClick={() => {
              const teamSlug = currentTeam?.slug || 'all';
              navigate(`/${teamSlug}/open/present`);
            }}
            className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors self-start sm:self-auto"
          >
            Presentation Mode
          </button>
        )}
      </div>
      
      {questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-2">🤔 No open questions yet</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">Be the first to ask a question!</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {questions.map((question) => (
            <div
              key={question.id}
              data-testid="question-item"
              className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer"
              onClick={() => handleQuestionClick(question)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                    {question.upvotes} upvote{question.upvotes !== 1 ? 's' : ''}
                  </span>
                  <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              
              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex items-center space-x-2 mb-3">
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
              
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-3 mb-4">
                {question.body}
              </p>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                <button className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors flex items-center">
                  Read Full Question
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpvote(question.id);
                  }}
                  disabled={upvotedQuestions.has(question.id)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    upvotedQuestions.has(question.id)
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-600'
                  }`}
                >
                  {upvotedQuestions.has(question.id) ? 'Upvoted' : 'Upvote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Question Modal */}
    <QuestionModal
      question={selectedQuestion}
      isOpen={isModalOpen}
      onClose={handleModalClose}
      onUpvote={handleUpvote}
      upvotedQuestions={upvotedQuestions}
    />
    </>
  );
}
