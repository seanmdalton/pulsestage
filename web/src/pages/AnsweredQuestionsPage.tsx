import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

export function AnsweredQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await apiClient.getQuestions('ANSWERED');
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Answered Questions</h1>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Answered Questions</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Answered Questions</h1>
      
      {questions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">No answered questions yet.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Question ({question.upvotes} upvotes)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{question.body}</p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Submitted {new Date(question.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">Answer</h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{question.responseText}</p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Answered {question.respondedAt ? new Date(question.respondedAt).toLocaleString() : 'Unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
