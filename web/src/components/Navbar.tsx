import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { TeamSelector } from './TeamSelector';
import { UserProfile } from './UserProfile';
import { PulseStageLogo } from './PulseStageLogo';
import { useTeam, getTeamSlug } from '../contexts/TeamContext';
import { useUser } from '../contexts/UserContext';

export function Navbar() {
  const location = useLocation();
  const { currentTeam } = useTeam();
  const { userTeams, getUserRoleInTeam } = useUser();

  // Check if user has admin privileges in any team
  const hasAdminRole = userTeams.some(team => {
    const role = getUserRoleInTeam(team.id);
    return role === 'admin' || role === 'owner';
  });

  // Generate team-aware navigation items
  const teamSlug = getTeamSlug(currentTeam);
  const navItems = [
    { path: `/${teamSlug}`, label: 'Submit Question' },
    { path: `/${teamSlug}/open`, label: 'Open Questions' },
    { path: `/${teamSlug}/answered`, label: 'Answered Questions' },
    // Only show Admin link if user has admin role in any team
    ...(hasAdminRole ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  // Helper function to check if a nav item is active
  const isActiveNavItem = (itemPath: string) => {
    if (itemPath === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === itemPath;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* PulseStage Logo */}
            <PulseStageLogo size="md" showWordmark={true} className="mr-4" />
            
            {/* Team Selector */}
            <TeamSelector />
            
            {/* Navigation Items */}
            <div className="flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveNavItem(item.path)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
}

