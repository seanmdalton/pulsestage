import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

type User = {
  id: string
  email: string
  name: string | null
  ssoId: string | null
  createdAt: string
  updatedAt: string
  memberships: Array<{
    id: string
    teamId: string
    role: 'member' | 'moderator' | 'admin' | 'owner'
    createdAt: string
    team: {
      id: string
      name: string
      slug: string
      isActive: boolean
    }
  }>
  _count: {
    questions: number
    upvotes: number
  }
}

type RoleChange = {
  userId: string
  teamId: string
  currentRole: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingRole, setEditingRole] = useState<RoleChange | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [removingUser, setRemovingUser] = useState<{
    user: User
    teamId: string
    teamName: string
  } | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search query
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.name?.toLowerCase().includes(query) ||
            user.memberships.some((m) =>
              m.team.name.toLowerCase().includes(query)
            )
        )
      )
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getAdminUsers()
      setUsers(response.users)
      setFilteredUsers(response.users)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (
    userId: string,
    teamId: string,
    newRole: 'member' | 'moderator' | 'admin' | 'owner'
  ) => {
    setIsUpdating(true)
    setMessage(null)

    try {
      await apiClient.updateTeamMemberRole(teamId, userId, newRole)
      await loadUsers() // Refresh the list
      setEditingRole(null)
      setMessage({
        type: 'success',
        text: 'User role updated successfully',
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveUser = async (userId: string, teamId: string) => {
    setMessage(null)
    try {
      await apiClient.removeTeamMember(teamId, userId)
      await loadUsers() // Refresh the list
      setRemovingUser(null)
      setMessage({
        type: 'success',
        text: 'User removed from team successfully',
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove user'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
      // Keep dialog open on specific errors
      if (!errorMessage.includes('Cannot remove')) {
        setRemovingUser(null)
      }
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'admin':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'moderator':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          User Management
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Loading users...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          User Management
        </h2>
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400">{error}</div>
          <button
            onClick={loadUsers}
            className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          User Management
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View and manage user roles across all teams ({users.length} users)
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email, name, or team..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No users found matching your search'
              : 'No users found'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              {/* User Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {user.name || user.email}
                    </h4>
                    {user.name && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      • {user._count.questions} questions
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      • {user._count.upvotes} upvotes
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Memberships */}
              {user.memberships.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Not a member of any teams
                </div>
              ) : (
                <div className="space-y-2">
                  {user.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {membership.team.name}
                        </span>
                        {!membership.team.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Dropdown or Badge */}
                        {editingRole?.userId === user.id &&
                        editingRole?.teamId === membership.teamId ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editingRole.currentRole}
                              onChange={(e) =>
                                setEditingRole({
                                  ...editingRole,
                                  currentRole: e.target.value,
                                })
                              }
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isUpdating}
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                            </select>
                            <button
                              onClick={() =>
                                handleRoleChange(
                                  user.id,
                                  membership.teamId,
                                  editingRole.currentRole as
                                    | 'member'
                                    | 'moderator'
                                    | 'admin'
                                    | 'owner'
                                )
                              }
                              disabled={
                                isUpdating ||
                                editingRole.currentRole === membership.role
                              }
                              className="px-2 py-1 text-xs bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingRole(null)}
                              disabled={isUpdating}
                              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setEditingRole({
                                  userId: user.id,
                                  teamId: membership.teamId,
                                  currentRole: membership.role,
                                })
                              }
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getRoleBadgeColor(membership.role)}`}
                              title="Click to change role"
                            >
                              {membership.role}
                            </button>
                            <button
                              onClick={() =>
                                setRemovingUser({
                                  user,
                                  teamId: membership.teamId,
                                  teamName: membership.team.name,
                                })
                              }
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                              title="Remove from team"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {removingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Remove User from Team?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove{' '}
              <span className="font-medium">
                {removingUser.user.name || removingUser.user.email}
              </span>{' '}
              from team{' '}
              <span className="font-medium">{removingUser.teamName}</span>?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  handleRemoveUser(removingUser.user.id, removingUser.teamId)
                }
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setRemovingUser(null)}
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
