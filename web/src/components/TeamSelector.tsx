import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTeam, getTeamDisplayName } from '../contexts/TeamContext';

export function TeamSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTeam, teams, isLoading } = useTeam();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTeamSelect = (teamSlug: string) => {
    setIsOpen(false);
    
    // Determine the current page type from the URL
    const pathParts = location.pathname.split('/').filter(Boolean);
    let pageType = '';
    
    if (pathParts.length >= 2) {
      pageType = pathParts[1]; // 'open' or 'answered'
    }
    
    // Navigate to the same page type but for the selected team
    if (pageType === 'open' || pageType === 'answered') {
      navigate(`/${teamSlug}/${pageType}`);
    } else {
      navigate(`/${teamSlug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading teams...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate max-w-32 sm:max-w-none">
          {getTeamDisplayName(currentTeam)}
        </span>
        {currentTeam?._count && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {currentTeam._count.questions}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            {/* All Teams option */}
            <button
              onClick={() => handleTeamSelect('all')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currentTeam === null
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">All Teams</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {teams.reduce((sum, team) => sum + (team._count?.questions || 0), 0)} total
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                View questions from all teams
              </div>
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            {/* Individual teams */}
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team.slug)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentTeam?.id === team.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {team._count?.questions || 0} questions
                  </span>
                </div>
                {team.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {team.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
