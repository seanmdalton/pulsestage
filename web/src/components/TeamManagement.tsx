import { useState, useEffect } from 'react'
import { apiClient, type Team, type CreateTeamRequest } from '../lib/api'
import { useTeam } from '../contexts/TeamContext'

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const { refreshTeams } = useTeam()

  // Form state
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    slug: '',
    description: '',
  })

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    name: string
    description: string
    isActive: boolean
  }>({
    name: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setError(null)
      const data = await apiClient.getTeams()
      setTeams(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }))
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.slug.trim()) return

    setIsCreating(true)
    setMessage(null)

    try {
      const newTeam = await apiClient.createTeam({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || '',
      })

      setTeams((prev) => [...prev, newTeam])
      setFormData({ name: '', slug: '', description: '' })
      setShowCreateForm(false)
      setMessage({
        type: 'success',
        text: `Team "${newTeam.name}" created successfully!`,
      })

      // Refresh the global team context
      await refreshTeams()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create team',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setEditFormData({
      name: team.name,
      description: team.description || '',
      isActive: team.isActive,
    })
    setMessage(null)
  }

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeam || !editFormData.name.trim()) return

    setIsUpdating(true)
    setMessage(null)

    try {
      const updatedTeam = await apiClient.updateTeam(editingTeam.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        isActive: editFormData.isActive,
      })

      setTeams((prev) =>
        prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
      )
      setEditingTeam(null)
      setMessage({
        type: 'success',
        text: `Team "${updatedTeam.name}" updated successfully!`,
      })

      // Refresh the global team context
      await refreshTeams()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update team',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTeam = async (team: Team) => {
    setMessage(null)

    try {
      await apiClient.deleteTeam(team.id)
      setTeams((prev) => prev.filter((t) => t.id !== team.id))
      setDeletingTeam(null)
      setMessage({
        type: 'success',
        text: `Team "${team.name}" deactivated successfully!`,
      })

      // Refresh the global team context
      await refreshTeams()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to deactivate team'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
      // Keep the dialog open if there was an error
      if (!errorMessage.includes('Cannot delete')) {
        setDeletingTeam(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Team Management
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Loading teams...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Team Management
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Team'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">Error: {error}</div>
        </div>
      )}

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Create New Team
          </h3>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label
                htmlFor="team-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Team Name *
              </label>
              <input
                id="team-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Engineering, Product, People..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={100}
                required
                disabled={isCreating}
              />
            </div>

            <div>
              <label
                htmlFor="team-slug"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                URL Slug *
              </label>
              <input
                id="team-slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="engineering, product, people..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={50}
                required
                disabled={isCreating}
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used in URLs: /{formData.slug || 'team-slug'}
              </div>
            </div>

            <div>
              <label
                htmlFor="team-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="team-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the team..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                maxLength={500}
                disabled={isCreating}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={
                  !formData.name.trim() || !formData.slug.trim() || isCreating
                }
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ name: '', slug: '', description: '' })
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Existing Teams ({teams.length})
        </h3>

        {teams.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              No teams found
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {team.name}
                      </h4>
                      {!team.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{team.slug}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      title="Edit team"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingTeam(team)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                      title="Deactivate team"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {team.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    {team._count?.questions || 0} questions
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                    {team._count?.memberships || 0} members
                  </span>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Created {new Date(team.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Edit Team
              </h3>
              <form onSubmit={handleUpdateTeam} className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-team-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Team Name *
                  </label>
                  <input
                    id="edit-team-name"
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    maxLength={100}
                    required
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-team-description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="edit-team-description"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    maxLength={500}
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={isUpdating}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Team is active
                    </span>
                  </label>
                  <p className="ml-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Inactive teams are hidden from the team selector
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={!editFormData.name.trim() || isUpdating}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Deactivate Team?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to deactivate "
              <span className="font-medium">{deletingTeam.name}</span>"? This
              will hide it from the team selector.
            </p>

            {deletingTeam._count && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This team currently has:
                </p>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• {deletingTeam._count.memberships || 0} members</li>
                  <li>• {deletingTeam._count.questions || 0} questions</li>
                </ul>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteTeam(deletingTeam)}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => setDeletingTeam(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
