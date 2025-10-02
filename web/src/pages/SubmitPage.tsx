import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { SearchResults } from '../components/SearchResults';
import { useTeamFromUrl } from '../hooks/useTeamFromUrl';
import { getTeamDisplayName } from '../contexts/TeamContext';

export function SubmitPage() {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());

  const { currentTeam } = useTeamFromUrl();
  const debouncedQuestion = useDebounce(question, 300); // 300ms delay

  // Load upvoted questions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('upvotedQuestions');
    if (stored) {
      try {
        setUpvotedQuestions(new Set(JSON.parse(stored)));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Search for similar questions when user types
  useEffect(() => {
    const searchQuestions = async () => {
      if (!debouncedQuestion || debouncedQuestion.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await apiClient.searchQuestions(debouncedQuestion, currentTeam?.id);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    searchQuestions();
  }, [debouncedQuestion, currentTeam?.id]);

  const handleUpvote = async (questionId: string) => {
    if (upvotedQuestions.has(questionId)) return;

    try {
      const updatedQuestion = await apiClient.upvoteQuestion(questionId);
      
      // Update the search results
      setSearchResults(prev => 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await apiClient.createQuestion({ 
        body: question.trim(),
        teamId: currentTeam?.id
      });
      setQuestion('');
      setMessage({ 
        type: 'success', 
        text: `Question submitted successfully${currentTeam ? ` to ${currentTeam.name}` : ''}!` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to submit question' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Submit a Question</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Submitting to: <span className="font-medium">{getTeamDisplayName(currentTeam)}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question here..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={6}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {question.length}/2000 characters
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!question.trim() || isSubmitting}
          className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>

      {/* Search Results */}
      <SearchResults
        results={searchResults}
        loading={searchLoading}
        query={debouncedQuestion}
        onUpvote={handleUpvote}
        upvotedQuestions={upvotedQuestions}
      />
    </div>
  );
}

