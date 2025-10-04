import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';
import { useAdmin } from '../contexts/AdminContext';
import { useUser } from '../contexts/UserContext';
import { ResponseModal } from '../components/ResponseModal';
import { TeamManagement } from '../components/TeamManagement';
import { PulseStageLogo } from '../components/PulseStageLogo';
import { useTheme } from '../contexts/ThemeContext';
import { ExportPage } from './ExportPage';
import { setFormattedPageTitle } from '../utils/titleUtils';
import { useTeamFromUrl } from '../hooks/useTeamFromUrl';

export function AdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdmin();
  const { userTeams, getUserRoleInTeam } = useUser();
  const { theme } = useTheme();
  const { currentTeam } = useTeamFromUrl();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'teams' | 'export'>('questions');
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(undefined, 'admin');
  }, []);

  // Check admin access and handle authentication
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    // Check if user has admin role in any team
    const hasAdminRole = userTeams.some(team => {
      const role = getUserRoleInTeam(team.id);
      return role === 'admin' || role === 'owner';
    });

    if (userTeams.length === 0) {
      // No user context yet, wait for it to load
      return;
    }

    if (!hasAdminRole) {
      // User doesn't have admin role, redirect to home
      navigate('/all');
      return;
    }

    // If user has admin role, we'll bypass the AdminContext authentication
    // and allow direct access to admin features
  }, [authLoading, userTeams, getUserRoleInTeam, navigate]);

  useEffect(() => {
    // Check if user has admin role
    const hasAdminRole = userTeams.some(team => {
      const role = getUserRoleInTeam(team.id);
      return role === 'admin' || role === 'owner';
    });

    if (hasAdminRole) {
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
    }
  }, [userTeams, getUserRoleInTeam, currentTeam?.id]);

  // Check API health status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.getHealth();
        setHealthStatus('healthy');
      } catch {
        setHealthStatus('unhealthy');
      }
    };
    checkHealth();
  }, []);

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


  // Check if user has admin role
  const hasAdminRole = userTeams.some(team => {
    const role = getUserRoleInTeam(team.id);
    return role === 'admin' || role === 'owner';
  });

  // Check if there are open questions for presentation mode
  const hasOpenQuestions = questions.some(q => q.status === 'OPEN');

  // Show loading while checking user roles or loading data
  if (userTeams.length === 0 || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Admin Panel</h1>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect if user doesn't have admin role
  if (!hasAdminRole) {
    return null; // The useEffect will handle the redirect
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
          <div className="flex items-center gap-4">
            {/* Icon only */}
            <img 
              src={theme === 'dark' ? '/pulsestage-icon-light.svg' : '/pulsestage-icon-dark.svg'}
              alt="PulseStage Icon"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage questions and teams
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* API Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-400">API Status:</div>
              <div
                data-testid="health-status"
                className={`w-3 h-3 rounded-full ${
                  healthStatus === 'healthy'
                    ? 'bg-green-500'
                    : healthStatus === 'unhealthy'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}
                title={
                  healthStatus === 'healthy'
                    ? 'API is healthy'
                    : healthStatus === 'unhealthy'
                    ? 'API is unhealthy'
                    : 'Checking API status...'
                }
              />
            </div>
            
            <button
              onClick={() => navigate('/all/open/present')}
              disabled={!hasOpenQuestions}
              className={`px-4 py-2 text-sm rounded-md transition-colors self-start sm:self-auto ${
                hasOpenQuestions
                  ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                  : 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
              }`}
              title={hasOpenQuestions ? 'Enter presentation mode' : 'No open questions available for presentation'}
            >
              Presentation Mode
            </button>
          </div>
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
                <button
                  onClick={() => setActiveTab('export')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'export'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Export
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

            {activeTab === 'export' && <ExportPage />}
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
