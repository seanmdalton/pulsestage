import { useState } from 'react';
import type { Question } from '../lib/api';
import { QuestionModal } from './QuestionModal';
import { AnswerModal } from './AnswerModal';

interface SearchResultsProps {
  results: Question[];
  loading: boolean;
  query: string;
  onUpvote?: (questionId: string) => void;
  upvotedQuestions?: Set<string>;
}

export function SearchResults({ results, loading, query, onUpvote, upvotedQuestions = new Set() }: SearchResultsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };
  if (!query || query.trim().length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">Searching for similar questions...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="text-sm text-green-800 dark:text-green-300">
          ✅ No similar questions found. Your question appears to be unique!
        </div>
      </div>
    );
  }

  const openQuestions = results.filter(q => q.status === 'OPEN');
  const answeredQuestions = results.filter(q => q.status === 'ANSWERED');

  return (
    <div className="mt-6 space-y-4">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Found {results.length} similar question{results.length === 1 ? '' : 's'}:
      </div>

      {/* Open Questions */}
      {openQuestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
            📝 Open Questions ({openQuestions.length}) - Consider upvoting instead:
          </h4>
          <div className="space-y-2">
            {openQuestions.map((question) => (
              <div
                key={question.id}
                className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{question.body}</p>
                    <button
                      onClick={() => handleQuestionClick(question)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center mb-2"
                    >
                      Read Full Question
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {question.upvotes} upvotes • {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {onUpvote && (
                    <button
                      onClick={() => onUpvote(question.id)}
                      disabled={upvotedQuestions.has(question.id)}
                      className={`ml-3 px-2 py-1 text-xs rounded transition-colors ${
                        upvotedQuestions.has(question.id)
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800'
                      }`}
                    >
                      {upvotedQuestions.has(question.id) ? 'Upvoted' : 'Upvote'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered Questions */}
      {answeredQuestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
            ✅ Answered Questions ({answeredQuestions.length}) - Your question may already be answered:
          </h4>
          <div className="space-y-2">
            {answeredQuestions.map((question) => (
              <div
                key={question.id}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="mb-2">
                  <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{question.body}</p>
                  <button
                    onClick={() => handleQuestionClick(question)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center mb-2"
                  >
                    Read Full Question
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {question.upvotes} upvotes • Answered {question.respondedAt ? new Date(question.respondedAt).toLocaleDateString() : 'recently'}
                  </div>
                </div>
                {question.responseText && (
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-1">Answer:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {question.responseText.length > 150 
                        ? `${question.responseText.substring(0, 150)}...` 
                        : question.responseText}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Question/Answer Modal */}
      {selectedQuestion && (
        selectedQuestion.status === 'ANSWERED' ? (
          <AnswerModal
            question={selectedQuestion}
            isOpen={isModalOpen}
            onClose={handleModalClose}
          />
        ) : (
          <QuestionModal
            question={selectedQuestion}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onUpvote={onUpvote || (() => {})}
            upvotedQuestions={upvotedQuestions}
          />
        )
      )}
    </div>
  );
}
