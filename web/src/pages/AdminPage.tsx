import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';
import { useAdmin } from '../contexts/AdminContext';
import { ResponseModal } from '../components/ResponseModal';
import { TeamManagement } from '../components/TeamManagement';

export function AdminPage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAdmin();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'teams'>('questions');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [isAuthenticated]);

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };

  const handleResponseSuccess = (updatedQuestion: Question) => {
    // Update the questions list to remove the answered question
    setQuestions(prevQuestions => 
      prevQuestions.filter(q => q.id !== updatedQuestion.id)
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Admin Panel</h1>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Admin Panel</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage questions and teams
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors self-start sm:self-auto"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Teams
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 mb-2">🎉 All caught up!</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">No open questions awaiting response.</div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Open Questions
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Click a question to respond
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                      onClick={() => handleQuestionClick(question)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                            {question.upvotes} upvote{question.upvotes !== 1 ? 's' : ''}
                          </span>
                          <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-3">
                        {question.body}
                      </p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          Click to respond →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'teams' && <TeamManagement />}
      </div>

      {/* Response Modal */}
      <ResponseModal
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleResponseSuccess}
      />
    </>
  );
}
