import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useTeam } from '../contexts/TeamContext';

interface ModerationStats {
  overall: {
    totalQuestionsReviewed: number;
    totalQuestionsAnswered: number;
    totalQuestionsPinned: number;
    totalQuestionsFrozen: number;
    activeModerators: number;
    avgResponseTime: number | null;
  };
  byModerator: Array<{
    moderatorId: string;
    moderatorName: string;
    moderatorEmail: string;
    questionsReviewed: number;
    questionsAnswered: number;
    questionsPinned: number;
    questionsFrozen: number;
    avgResponseTime: number | null;
    teamsCount: number;
  }>;
}

export function ModerationStatsPage() {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  });

  const { teams } = useTeam();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        const filters: any = {};
        if (teamFilter) filters.teamId = teamFilter;
        if (dateRange.startDate) filters.startDate = dateRange.startDate;
        if (dateRange.endDate) filters.endDate = dateRange.endDate;

        const data = await apiClient.getModerationStats(filters);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [teamFilter, dateRange]);

  const formatMinutes = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading stats...</div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Moderation Stats</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track moderation activity and performance metrics
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team
            </label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions Reviewed</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.overall.totalQuestionsReviewed}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions Answered</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.overall.totalQuestionsAnswered}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions Pinned</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.overall.totalQuestionsPinned}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response Time</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatMinutes(stats.overall.avgResponseTime)}
          </div>
        </div>
      </div>

      {/* Per-Moderator Stats */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Moderator Performance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stats.overall.activeModerators} active moderator{stats.overall.activeModerators !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Moderator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviewed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Answered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pinned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frozen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teams
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.byModerator.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No moderation activity yet
                  </td>
                </tr>
              ) : (
                stats.byModerator.map((mod) => (
                  <tr key={mod.moderatorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {mod.moderatorName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {mod.moderatorEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {mod.questionsReviewed}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400 font-medium">
                      {mod.questionsAnswered}
                    </td>
                    <td className="px-6 py-4 text-sm text-yellow-600 dark:text-yellow-400">
                      {mod.questionsPinned}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400">
                      {mod.questionsFrozen}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatMinutes(mod.avgResponseTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {mod.teamsCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviewed</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.overall.totalQuestionsReviewed}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Answered Rate</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.overall.totalQuestionsReviewed > 0
                  ? `${Math.round((stats.overall.totalQuestionsAnswered / stats.overall.totalQuestionsReviewed) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Questions Frozen</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.overall.totalQuestionsFrozen}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Moderators</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.overall.activeModerators}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg per Moderator</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.overall.activeModerators > 0
                  ? Math.round(stats.overall.totalQuestionsReviewed / stats.overall.activeModerators)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Coverage</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.byModerator.reduce((sum, mod) => sum + mod.teamsCount, 0)} team assignments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

