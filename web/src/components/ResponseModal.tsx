import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

interface ResponseModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedQuestion: Question) => void;
}

export function ResponseModal({ question, isOpen, onClose, onSuccess }: ResponseModalProps) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or question changes
  useEffect(() => {
    if (isOpen && question) {
      setResponse('');
      setError(null);
    }
  }, [isOpen, question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !response.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedQuestion = await apiClient.respondToQuestionWithSession(
        question.id, 
        { response: response.trim() }
      );
      
      onSuccess(updatedQuestion);
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message.includes('authentication required')) {
        setError('Your session has expired. Please refresh the page and log in again.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to submit response');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Respond to Question"
    >
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
          <div>
            <label htmlFor="response" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
  );
}
