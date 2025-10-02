import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';

/**
 * Hook to sync URL team slug with TeamContext
 * Handles team validation and navigation
 */
export function useTeamFromUrl() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const navigate = useNavigate();
  const { currentTeam, teams, setCurrentTeam, isLoading } = useTeam();

  useEffect(() => {
    if (isLoading || !teamSlug) return;

    if (teamSlug === 'all') {
      // "All Teams" view
      if (currentTeam !== null) {
        setCurrentTeam(null);
      }
    } else {
      // Specific team view
      const team = teams.find(t => t.slug === teamSlug);
      if (team) {
        if (currentTeam?.id !== team.id) {
          setCurrentTeam(team);
        }
      } else {
        // Team not found, redirect to all teams
        console.warn(`Team with slug "${teamSlug}" not found, redirecting to all teams`);
        navigate('/all', { replace: true });
      }
    }
  }, [teamSlug, teams, currentTeam, setCurrentTeam, navigate, isLoading]);

  return {
    teamSlug: teamSlug || 'all',
    currentTeam,
    isLoading
  };
}
