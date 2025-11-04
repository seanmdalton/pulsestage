import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

type User = {
  id: string
  email: string
  name: string | null
  ssoId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  memberships: Array<{
    id: string
    teamId: string
    role: 'member' | 'moderator' | 'admin' | 'owner' | 'viewer'
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

type ImportResult = {
  rowNumber: number
  email: string
  name: string
  homeTeam: string
  role: string
  status: 'error' | 'pending' | 'success'
  errors?: string[]
  action: 'create' | 'update' | 'unknown'
}

type ImportSummary = {
  total: number
  valid?: number
  errors?: number
  toCreate?: number
  toUpdate?: number
  imported?: number
  failed?: number
  skipped?: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // CSV Import State
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvContent, setCsvContent] = useState('')
  const [importPreview, setImportPreview] = useState<{
    summary: ImportSummary
    results: ImportResult[]
  } | null>(null)
  const [importing, setImporting] = useState(false)

  // User action state
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

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
    setCurrentPage(1) // Reset to first page when search changes
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

  const handleToggleUserStatus = async (user: User) => {
    try {
      setTogglingUserId(user.id)
      if (user.isActive) {
        await apiClient.deactivateUser(user.id)
        setMessage({
          type: 'success',
          text: `${user.name || user.email} deactivated`,
        })
      } else {
        await apiClient.activateUser(user.id)
        setMessage({
          type: 'success',
          text: `${user.name || user.email} reactivated`,
        })
      }
      // Reload users to reflect the change
      await loadUsers()
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      setMessage({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Failed to update user status',
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a CSV file' })
      return
    }

    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvContent(content)
    }
    reader.readAsText(file)
  }

  const handlePreview = async () => {
    if (!csvContent) {
      setMessage({ type: 'error', text: 'Please upload a CSV file first' })
      return
    }

    setImporting(true)
    setMessage(null)
    try {
      const response = await apiClient.importUsers(csvContent, true)
      setImportPreview(response)

      if (response.summary.errors && response.summary.errors > 0) {
        setMessage({
          type: 'error',
          text: `Found ${response.summary.errors} error(s) in CSV. Please review below.`,
        })
      } else {
        setMessage({
          type: 'success',
          text: `Ready to import ${response.summary.valid || 0} user(s)`,
        })
      }
    } catch (err) {
      console.error('Preview failed:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to preview CSV',
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!csvContent) {
      setMessage({ type: 'error', text: 'Please upload a CSV file first' })
      return
    }

    if (!importPreview || (importPreview.summary.errors || 0) > 0) {
      setMessage({
        type: 'error',
        text: 'Please fix all errors before importing',
      })
      return
    }

    setImporting(true)
    setMessage(null)
    try {
      const response = await apiClient.importUsers(csvContent, false)
      setMessage({
        type: 'success',
        text: `Successfully imported ${response.summary.imported || 0} user(s)`,
      })
      // Reset import dialog
      setShowImportDialog(false)
      setCsvFile(null)
      setCsvContent('')
      setImportPreview(null)
      // Reload users
      await loadUsers()
    } catch (err) {
      console.error('Import failed:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import users',
      })
    } finally {
      setImporting(false)
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
      case 'viewer':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              User Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage users across all teams ({users.length} users)
            </p>
          </div>
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-sm font-medium"
          >
            Import CSV
          </button>
        </div>
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

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No users found matching your search'
              : 'No users found'}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Teams
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Activity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name || user.email}
                        </div>
                        {user.name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {user.memberships.length === 0 ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No teams
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.memberships.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-gray-700 dark:text-gray-300">
                                {m.team.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(m.role)}`}
                              >
                                {m.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user._count.questions} Q • {user._count.upvotes} ⬆
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={togglingUserId === user.id}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          user.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {togglingUserId === user.id
                          ? 'Loading...'
                          : user.isActive
                            ? 'Deactivate'
                            : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CSV Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Import Users from CSV
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload a CSV file with columns: email, name, homeTeam, role
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportDialog(false)
                  setCsvFile(null)
                  setCsvContent('')
                  setImportPreview(null)
                  setMessage(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {csvFile && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)}{' '}
                  KB)
                </p>
              )}
            </div>

            {/* CSV Format Help */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                CSV Format
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Your CSV must include these columns (header row required):
              </p>
              <code className="block text-xs bg-white dark:bg-gray-900 p-2 rounded border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100">
                email,name,homeTeam,role
                <br />
                alice@company.com,Alice Smith,engineering,member
                <br />
                bob@company.com,Bob Jones,product,admin
              </code>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Valid roles: viewer, member, moderator, admin, owner
                <br />
                homeTeam should match an existing team slug (e.g.,
                "engineering", "product")
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handlePreview}
                disabled={!csvContent || importing}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {importing && !importPreview ? 'Validating...' : 'Preview'}
              </button>
              {importPreview && (importPreview.summary.errors || 0) === 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {importing ? 'Importing...' : 'Import Users'}
                </button>
              )}
            </div>

            {/* Preview Results */}
            {importPreview && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Import Preview
                </h4>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {importPreview.summary.total}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Rows
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {importPreview.summary.valid || 0}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Valid
                    </div>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {importPreview.summary.errors || 0}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Errors
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {(importPreview.summary.toCreate || 0) +
                        (importPreview.summary.toUpdate || 0)}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      To Process
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-750">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Row
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Email
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Name
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Action
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.results.map((result, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 dark:border-gray-700 ${
                            result.status === 'error'
                              ? 'bg-red-50 dark:bg-red-900/10'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                            {result.rowNumber}
                          </td>
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                            {result.email}
                          </td>
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                            {result.name}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                result.action === 'create'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : result.action === 'update'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {result.action}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {result.status === 'error' ? (
                              <div className="text-red-600 dark:text-red-400 text-xs">
                                {result.errors?.map((err, i) => (
                                  <div key={i}>{err}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 text-xs">
                                Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
