import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

export function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminKey, setAdminKey] = useState('');

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
  }, []);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId || !response.trim() || !adminKey.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await apiClient.respondToQuestion(selectedQuestionId, { response: response.trim() }, adminKey);
      setResponse('');
      setSelectedQuestionId('');
      setMessage({ type: 'success', text: 'Response submitted successfully!' });
      
      // Reload questions to show updated status
      const data = await apiClient.getQuestions('OPEN');
      setQuestions(data);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to submit response' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Open Questions List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Questions</h2>
          {questions.length === 0 ? (
            <div className="text-gray-500">No open questions.</div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedQuestionId === question.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedQuestionId(question.id)}
                >
                  <p className="text-gray-900 mb-2">{question.body}</p>
                  <div className="text-sm text-gray-500">
                    {question.upvotes} upvotes • {new Date(question.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Respond to Question</h2>
          
          <form onSubmit={handleRespond} className="space-y-4">
            <div>
              <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Key
              </label>
              <input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin key"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                Response
              </label>
              <textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter your response..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={8}
                maxLength={10000}
                disabled={isSubmitting || !selectedQuestionId}
              />
              <div className="mt-1 text-sm text-gray-500">
                {response.length}/10000 characters
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedQuestionId || !response.trim() || !adminKey.trim() || isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
