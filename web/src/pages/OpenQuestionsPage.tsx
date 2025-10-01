import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

export function OpenQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await apiClient.getQuestions('OPEN');
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
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Open Questions</h1>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Open Questions</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Open Questions</h1>
      
      {questions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">No open questions yet.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900 mb-2">{question.body}</p>
                  <div className="text-sm text-gray-500">
                    Submitted {new Date(question.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{question.upvotes}</span>
                  <button
                    onClick={() => handleUpvote(question.id)}
                    disabled={upvotedQuestions.has(question.id)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      upvotedQuestions.has(question.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {upvotedQuestions.has(question.id) ? 'Upvoted' : 'Upvote'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
