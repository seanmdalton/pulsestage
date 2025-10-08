import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

interface HealthMetrics {
  status: string
  timestamp: string
  uptime: {
    seconds: number
    formatted: string
  }
  database: {
    status: string
    responseTimeMs: number | null
    provider: string
  }
  redis: {
    rateLimit: {
      connected: boolean
      ready: boolean
      enabled: boolean
    }
    sessions: {
      connected: boolean
      ready: boolean
    }
  }
  sse: {
    totalConnections: number
    tenantCount: number
    tenantConnections: Record<string, number>
  }
  memory: {
    rss: string
    heapTotal: string
    heapUsed: string
    external: string
  }
  data: {
    tenants: number
    questions: number
    users: number
  }
  environment: string
  nodeVersion: string
}

export function HealthDashboardPage() {
  const [health, setHealth] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadHealthMetrics = async () => {
    try {
      setError(null)
      const data = await apiClient.getHealthMetrics()
      setHealth(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load health metrics'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHealthMetrics()
  }, [])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadHealthMetrics()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 dark:text-green-400'
      case 'disconnected':
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-yellow-600 dark:text-yellow-400'
    }
  }

  const getStatusBadge = (connected: boolean, ready: boolean) => {
    if (connected && ready) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Connected
        </span>
      )
    } else if (connected) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Connecting
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Disconnected
        </span>
      )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Health Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time system metrics and status
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-refresh (10s)
            </span>
          </label>
          <button
            onClick={loadHealthMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mb-6 p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Last updated: {new Date(health.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${getStatusColor(health.status)}`}
            >
              {health.status.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Uptime: {health.uptime.formatted}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database */}
        <div className="p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Database
            </h3>
            <span className="text-2xl">🗄️</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </div>
              <div
                className={`text-lg font-medium ${getStatusColor(health.database.status)}`}
              >
                {health.database.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Provider
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.database.provider}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Response Time
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.database.responseTimeMs !== null
                  ? `${health.database.responseTimeMs}ms`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Redis - Rate Limiting */}
        <div className="p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Redis (Rate Limiting)
            </h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </div>
              <div className="mt-1">
                {getStatusBadge(
                  health.redis.rateLimit.connected,
                  health.redis.rateLimit.ready
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Enabled
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.redis.rateLimit.enabled ? 'Yes' : 'No (Dev Mode)'}
              </div>
            </div>
          </div>
        </div>

        {/* Redis - Sessions */}
        <div className="p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Redis (Sessions)
            </h3>
            <span className="text-2xl">🔐</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </div>
              <div className="mt-1">
                {getStatusBadge(
                  health.redis.sessions.connected,
                  health.redis.sessions.ready
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Store
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                Redis
              </div>
            </div>
          </div>
        </div>

        {/* Server-Sent Events */}
        <div className="p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Real-Time (SSE)
            </h3>
            <span className="text-2xl">📡</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Connections
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {health.sse.totalConnections}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Tenants
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.sse.tenantCount}
              </div>
            </div>
            {Object.keys(health.sse.tenantConnections).length > 0 && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Per-Tenant
                </div>
                <div className="space-y-1">
                  {Object.entries(health.sse.tenantConnections).map(
                    ([tenantId, count]) => (
                      <div
                        key={tenantId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {tenantId.substring(0, 8)}...
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Memory Usage */}
        <div className="p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Memory Usage
            </h3>
            <span className="text-2xl">💾</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                RSS
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.memory.rss}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Heap Used
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.memory.heapUsed}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Heap Total
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.memory.heapTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Data Statistics */}
        <div className="p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Statistics
            </h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tenants
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {health.data.tenants}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Questions
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.data.questions.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Users
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {health.data.users.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="mt-6 p-6 bg-white dark:bg-pulse-dark rounded-lg shadow border border-gray-200 dark:border-pulse-surface">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Environment Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Environment
            </div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {health.environment}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Node.js Version
            </div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {health.nodeVersion}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Uptime (seconds)
            </div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {health.uptime.seconds.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              External Memory
            </div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {health.memory.external}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
