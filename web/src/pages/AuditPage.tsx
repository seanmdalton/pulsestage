/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'

interface AuditPageProps {
  embedded?: boolean // When true, skip navbar and header
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  createdAt: string
  ipAddress: string | null
  userAgent: string | null
  metadata: any
  user: {
    id: string
    email: string
    name: string | null
  } | null
}

interface AuditResponse {
  logs: AuditLog[]
  total: number
  limit: number
  offset: number
}

export function AuditPage({ embedded = false }: AuditPageProps = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  // Export state
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadAuditLogs()
  }, [actionFilter, entityTypeFilter, userFilter, startDate, endDate, offset])

  const loadAuditLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (actionFilter) params.append('action', actionFilter)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (userFilter) params.append('userId', userFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/audit?${params.toString()}`,
        {
          credentials: 'include',
          headers: {
            'x-tenant-id': localStorage.getItem('mock-tenant') || 'default',
            'x-mock-sso-user': localStorage.getItem('mock-sso-user') || '',
          },
        }
      )

      if (!response.ok) throw new Error('Failed to load audit logs')

      const data: AuditResponse = await response.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (actionFilter) params.append('action', actionFilter)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (userFilter) params.append('userId', userFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('format', format)

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/audit/export?${params.toString()}`,
        {
          credentials: 'include',
          headers: {
            'x-tenant-id': localStorage.getItem('mock-tenant') || 'default',
            'x-mock-sso-user': localStorage.getItem('mock-sso-user') || '',
          },
        }
      )

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export audit logs:', err)
      alert('Failed to export audit logs')
    } finally {
      setExporting(false)
    }
  }

  const resetFilters = () => {
    setActionFilter('')
    setEntityTypeFilter('')
    setUserFilter('')
    setStartDate('')
    setEndDate('')
    setOffset(0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 dark:text-green-400'
    if (action.includes('update')) return 'text-blue-600 dark:text-blue-400'
    if (action.includes('delete') || action.includes('deactivate'))
      return 'text-red-600 dark:text-red-400'
    if (action.includes('answer')) return 'text-purple-600 dark:text-purple-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  const content = (
    <>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Audit Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and export all administrative actions
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setOffset(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="question.answer">Answer Question</option>
              <option value="team.create">Create Team</option>
              <option value="team.update">Update Team</option>
              <option value="team.deactivate">Deactivate Team</option>
              <option value="tag.create">Create Tag</option>
              <option value="question.tag.add">Add Tag to Question</option>
              <option value="question.tag.remove">
                Remove Tag from Question
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entity Type
            </label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value)
                setOffset(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Question">Question</option>
              <option value="Team">Team</option>
              <option value="Tag">Tag</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setOffset(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setOffset(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Reset Filters
          </button>

          <button
            onClick={() => exportLogs('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={() => exportLogs('json')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audit Entries ({total.toLocaleString()} total)
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading audit logs...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No audit logs found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div>
                          {log.user?.name || log.user?.email || 'System'}
                        </div>
                        {log.user?.email && log.user?.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user.email}
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.entityType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {log.metadata && (
                          <details className="cursor-pointer">
                            <summary className="hover:text-blue-600 dark:hover:text-blue-400">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {offset + 1} - {Math.min(offset + limit, total)} of{' '}
                  {total.toLocaleString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setOffset(
                        Math.min((totalPages - 1) * limit, offset + limit)
                      )
                    }
                    disabled={offset + limit >= total}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">{content}</main>
    </div>
  )
}
