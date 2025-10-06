import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api'
import type { ExportFilters, ExportPreview, Team, Tag } from '../lib/api'
import { useUser } from '../contexts/UserContext'
import { setFormattedPageTitle } from '../utils/titleUtils'

export function ExportPage() {
  const { userTeams, getUserRoleInTeam, isLoading } = useUser()
  const navigate = useNavigate()

  const [teams, setTeams] = useState<Team[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<ExportFilters>({
    teamId: 'all',
    status: 'both',
    hasResponse: undefined,
    minUpvotes: undefined,
    maxUpvotes: undefined,
    tagIds: undefined,
    startDate: undefined,
    endDate: undefined,
    limit: 100,
  })

  // Set page title
  useEffect(() => {
    setFormattedPageTitle(undefined, 'admin')
  }, [])

  // Check if user has admin role
  const hasAdminRole = userTeams.some((team) => {
    const role = getUserRoleInTeam(team.id)
    return role === 'admin' || role === 'owner'
  })

  // Redirect if not authenticated or doesn't have admin role
  useEffect(() => {
    if (!isLoading && (!hasAdminRole || userTeams.length === 0)) {
      navigate('/admin/login')
    }
  }, [hasAdminRole, userTeams.length, isLoading, navigate])

  // Load teams and tags
  useEffect(() => {
    const loadData = async () => {
      if (!hasAdminRole) return

      try {
        const [teamsData, tagsData] = await Promise.all([
          apiClient.getTeams(),
          apiClient.getTags(),
        ])
        setTeams(teamsData)
        setTags(tagsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    }

    loadData()
  }, [hasAdminRole])

  // Load preview when filters change
  useEffect(() => {
    const loadPreview = async () => {
      if (!hasAdminRole) return

      setLoading(true)
      try {
        const previewData = await apiClient.getExportPreview(filters)
        setPreview(previewData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [filters, hasAdminRole])

  const handleFilterChange = (key: keyof ExportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleDownload = async (format: 'csv' | 'json') => {
    if (!preview) return

    setExporting(true)
    try {
      const blob = await apiClient.downloadExport(filters, format)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ama-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          Loading export page...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Export Data
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Export Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Export questions with full metadata for analysis and backup
          </p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors self-start sm:self-auto"
        >
          Back to Admin
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Export Filters
            </h2>

            <div className="space-y-4">
              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team
                </label>
                <select
                  value={filters.teamId || 'all'}
                  onChange={(e) => handleFilterChange('teamId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || 'both'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="both">Open & Answered</option>
                  <option value="open">Open Only</option>
                  <option value="answered">Answered Only</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'startDate',
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) =>
                      handleFilterChange('endDate', e.target.value || undefined)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="End date"
                  />
                </div>
              </div>

              {/* Upvote Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upvote Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={filters.minUpvotes || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'minUpvotes',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    min="0"
                    value={filters.maxUpvotes || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'maxUpvotes',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Response Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Response Status
                </label>
                <select
                  value={filters.hasResponse || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'hasResponse',
                      e.target.value || undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Either</option>
                  <option value="true">Has Response</option>
                  <option value="false">No Response</option>
                </select>
              </div>

              {/* Tag Filter */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (optional)
                  </label>
                  <select
                    multiple
                    value={filters.tagIds || []}
                    onChange={(e) => {
                      const selectedTags = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                      handleFilterChange(
                        'tagIds',
                        selectedTags.length > 0 ? selectedTags : undefined
                      )
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    size={3}
                  >
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hold Ctrl/Cmd to select multiple
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview and Export Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Export Preview
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!preview || exporting || preview.count === 0}
                  className="px-4 py-2 text-sm bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? 'Exporting...' : 'Download CSV'}
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!preview || exporting || preview.count === 0}
                  className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? 'Exporting...' : 'Download JSON'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  Loading preview...
                </div>
              </div>
            ) : preview ? (
              <>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>{preview.count}</strong> questions will be exported
                    {preview.count > 1000 && (
                      <div className="mt-1 text-orange-700 dark:text-orange-300">
                        ⚠️ Large export detected. Download may take time and
                        could timeout.
                      </div>
                    )}
                  </div>
                </div>

                {preview.count > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                            Question
                          </th>
                          <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </th>
                          <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                            Upvotes
                          </th>
                          <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                            Team
                          </th>
                          <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                            Tags
                          </th>
                          <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.slice(0, 10).map((question) => (
                          <tr
                            key={question.id}
                            className="border-b border-gray-100 dark:border-gray-700"
                          >
                            <td className="py-2 text-gray-900 dark:text-gray-100">
                              <div
                                className="max-w-xs truncate"
                                title={question.body}
                              >
                                {question.body}
                              </div>
                            </td>
                            <td className="py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  question.status === 'OPEN'
                                    ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                }`}
                              >
                                {question.status}
                              </span>
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {question.upvotes}
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {question.team?.name || 'General'}
                            </td>
                            <td className="py-2">
                              <div className="flex flex-wrap gap-1">
                                {question.tags?.slice(0, 2).map((qt) => (
                                  <span
                                    key={qt.id}
                                    className="px-1 py-0.5 rounded text-xs text-white"
                                    style={{ backgroundColor: qt.tag.color }}
                                  >
                                    {qt.tag.name}
                                  </span>
                                ))}
                                {question.tags && question.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{question.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {formatDate(question.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.preview.length > 10 && (
                      <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Showing first 10 of {preview.preview.length} preview
                        items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      No questions match the current filters
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  No preview available
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
