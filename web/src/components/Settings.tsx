import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import type { ThemeName } from '../lib/themes'
import { themes } from '../lib/themes'
import { ThemePreviewCard } from './ThemePreviewCard'
import { useTheme } from '../contexts/ThemeContext'

type TenantSettings = {
  questions: {
    minLength: number
    maxLength: number
  }
  users: {
    defaultRole: string
  }
  security: {
    sessionTimeout: number
    adminSessionTimeout: number
    rateLimits: {
      questionsPerHour: number
      upvotesPerMinute: number
      responsesPerHour: number
      searchPerMinute: number
    }
  }
  branding: {
    theme: ThemeName
    logo: string | null
    logoUrl: string | null
    primaryColor: string
    accentColor: string
    welcomeMessage: string
    showWelcomeMessage: boolean
  }
  features: {
    tagging: boolean
    search: boolean
    presentationMode: boolean
    exports: boolean
    auditLogs: boolean
  }
}

export function Settings() {
  const { setTheme: applyTheme, theme, colorMode } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get current theme colors for inline styles
  const themeColors = colorMode === 'light' ? theme.light : theme.dark

  // Organization settings (from /admin/settings)
  const [orgName, setOrgName] = useState('')
  const [originalOrgName, setOriginalOrgName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')

  // Tenant settings (from /admin/tenant-settings)
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(
    null
  )
  const [originalSettings, setOriginalSettings] =
    useState<TenantSettings | null>(null)

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Load settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load organization info
      const orgResponse = await apiClient.getAdminSettings()
      setOrgName(orgResponse.tenant.name)
      setOriginalOrgName(orgResponse.tenant.name)
      setTenantSlug(orgResponse.tenant.slug)

      // Load tenant settings
      const settingsResponse = await apiClient.getTenantSettings()
      setTenantSettings(settingsResponse.settings as unknown as TenantSettings)
      setOriginalSettings(JSON.parse(JSON.stringify(settingsResponse.settings)))
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Client-side validation
      if (tenantSettings) {
        // Validate question lengths
        if (
          tenantSettings.questions.minLength < 1 ||
          tenantSettings.questions.minLength > 2000
        ) {
          setError(
            'Question minimum length must be between 1 and 2000 characters'
          )
          return
        }
        if (
          tenantSettings.questions.maxLength < 10 ||
          tenantSettings.questions.maxLength > 5000
        ) {
          setError(
            'Question maximum length must be between 10 and 5000 characters'
          )
          return
        }
        if (
          tenantSettings.questions.minLength >=
          tenantSettings.questions.maxLength
        ) {
          setError('Question minimum length must be less than maximum length')
          return
        }

        // Validate session timeouts
        if (
          tenantSettings.security.sessionTimeout < 1 ||
          tenantSettings.security.sessionTimeout > 720
        ) {
          setError('Session timeout must be between 1 and 720 hours')
          return
        }
        if (
          tenantSettings.security.adminSessionTimeout < 1 ||
          tenantSettings.security.adminSessionTimeout > 720
        ) {
          setError('Admin session timeout must be between 1 and 720 hours')
          return
        }

        // Validate rate limits
        const { rateLimits } = tenantSettings.security
        if (
          rateLimits.questionsPerHour < 1 ||
          rateLimits.questionsPerHour > 100
        ) {
          setError('Questions per hour must be between 1 and 100')
          return
        }
        if (
          rateLimits.upvotesPerMinute < 1 ||
          rateLimits.upvotesPerMinute > 200
        ) {
          setError('Upvotes per minute must be between 1 and 200')
          return
        }
        if (
          rateLimits.responsesPerHour < 1 ||
          rateLimits.responsesPerHour > 50
        ) {
          setError('Responses per hour must be between 1 and 50')
          return
        }
        if (
          rateLimits.searchPerMinute < 1 ||
          rateLimits.searchPerMinute > 500
        ) {
          setError('Search per minute must be between 1 and 500')
          return
        }
      }

      let hasChanges = false

      // Save organization name if changed
      if (orgName.trim() !== originalOrgName) {
        if (!orgName.trim()) {
          setError('Organization name cannot be empty')
          return
        }
        await apiClient.updateAdminSettings({ name: orgName.trim() })
        setOriginalOrgName(orgName.trim())
        hasChanges = true
      }

      // Save tenant settings if changed
      if (
        tenantSettings &&
        JSON.stringify(tenantSettings) !== JSON.stringify(originalSettings)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await apiClient.updateTenantSettings(tenantSettings as any)
        setOriginalSettings(JSON.parse(JSON.stringify(tenantSettings)))
        hasChanges = true
      }

      if (hasChanges) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setSuccess('No changes to save')
        setTimeout(() => setSuccess(null), 2000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      // Try to extract the error message from the API response
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.message ||
        'Failed to save settings. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setOrgName(originalOrgName)
    if (originalSettings) {
      setTenantSettings(JSON.parse(JSON.stringify(originalSettings)))
    }
    setError(null)
    setSuccess(null)
    setFieldErrors({})
  }

  // Real-time validation helpers
  const validateField = (field: string, value: number): string | null => {
    switch (field) {
      case 'minLength':
        if (value < 1 || value > 2000) {
          return 'Must be between 1 and 2000'
        }
        if (tenantSettings && value >= tenantSettings.questions.maxLength) {
          return 'Must be less than max length'
        }
        return null

      case 'maxLength':
        if (value < 10 || value > 5000) {
          return 'Must be between 10 and 5000'
        }
        if (tenantSettings && value <= tenantSettings.questions.minLength) {
          return 'Must be greater than min length'
        }
        return null

      case 'sessionTimeout':
        if (value < 1 || value > 720) {
          return 'Must be between 1 and 720 hours'
        }
        return null

      case 'adminSessionTimeout':
        if (value < 1 || value > 720) {
          return 'Must be between 1 and 720 hours'
        }
        return null

      case 'questionsPerHour':
        if (value < 1 || value > 100) {
          return 'Must be between 1 and 100'
        }
        return null

      case 'upvotesPerMinute':
        if (value < 1 || value > 200) {
          return 'Must be between 1 and 200'
        }
        return null

      case 'responsesPerHour':
        if (value < 1 || value > 50) {
          return 'Must be between 1 and 50'
        }
        return null

      case 'searchPerMinute':
        if (value < 1 || value > 500) {
          return 'Must be between 1 and 500'
        }
        return null

      default:
        return null
    }
  }

  const updateFieldError = (field: string, value: number) => {
    const error = validateField(field, value)
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[field] = error
      } else {
        delete newErrors[field]
      }
      return newErrors
    })
  }

  const hasOrgChanges = orgName.trim() !== originalOrgName
  const hasSettingsChanges =
    tenantSettings &&
    JSON.stringify(tenantSettings) !== JSON.stringify(originalSettings)
  const hasChanges = hasOrgChanges || hasSettingsChanges
  const hasValidationErrors = Object.keys(fieldErrors).length > 0

  if (loading || !tenantSettings) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Settings
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading settings...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Settings
      </h2>

      {/* Error/Success Messages (Global) */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-800 dark:text-green-200 text-sm">
            {success}
          </p>
        </div>
      )}

      {/* Organization Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            General Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your organization's basic information
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="orgName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
              disabled={saving}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This name appears in the header and throughout the application.
            </p>
          </div>

          <div>
            <label
              htmlFor="tenantSlug"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tenant Identifier
            </label>
            <input
              id="tenantSlug"
              type="text"
              value={tenantSlug}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The tenant identifier cannot be changed after creation.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div
        className="rounded-lg shadow mb-6"
        style={{ backgroundColor: themeColors.surface }}
      >
        <div
          className="p-6 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Theme & Appearance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose a theme that matches your brand. Each theme supports light
            and dark mode.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(themes).map((theme) => (
              <ThemePreviewCard
                key={theme.name}
                theme={theme}
                isSelected={tenantSettings.branding.theme === theme.name}
                onSelect={() => {
                  const newTheme = theme.name
                  setTenantSettings({
                    ...tenantSettings,
                    branding: {
                      ...tenantSettings.branding,
                      theme: newTheme,
                    },
                  })
                  // Apply theme immediately for preview
                  applyTheme(newTheme)
                }}
              />
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Theme changes are previewed immediately.
              Click "Save All Changes" below to persist your selection.
            </p>
          </div>

          {/* Debug: Show current theme colors */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
              🔍 Debug: Current Theme State
            </p>
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300 font-mono">
              <div>
                Context Theme: <strong>{theme.name}</strong>
              </div>
              <div>
                Context Mode: <strong>{colorMode}</strong>
              </div>
              <div>
                Settings Theme: <strong>{tenantSettings.branding.theme}</strong>
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="font-semibold mb-1">Theme Colors from Context:</p>
                <div>
                  Primary:{' '}
                  <strong style={{ color: themeColors.primary }}>
                    {themeColors.primary}
                  </strong>
                </div>
                <div>
                  Secondary:{' '}
                  <strong style={{ color: themeColors.secondary }}>
                    {themeColors.secondary}
                  </strong>
                </div>
                <div>
                  Accent:{' '}
                  <strong style={{ color: themeColors.accent }}>
                    {themeColors.accent}
                  </strong>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  title="CSS Variable"
                />
                <span className="text-xs">CSS Var</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: themeColors.primary }}
                  title="Context Value"
                />
                <span className="text-xs">Context</span>
              </div>
              <button
                onClick={() => {
                  console.log('🧪 TEST BUTTON CLICKED')
                  console.log('Current theme from context:', theme.name)
                  console.log('Current colors:', themeColors)
                }}
                className="px-3 py-1 text-xs rounded border border-gray-400"
                style={{
                  backgroundColor: themeColors.primary,
                  color: 'white',
                }}
              >
                Test Button
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Question Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure question submission limits
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minLength"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Minimum Length (characters)
              </label>
              <input
                id="minLength"
                type="number"
                min={1}
                max={2000}
                value={tenantSettings.questions.minLength}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setTenantSettings({
                    ...tenantSettings,
                    questions: {
                      ...tenantSettings.questions,
                      minLength: value,
                    },
                  })
                  updateFieldError('minLength', value)
                  // Also re-validate maxLength since they're related
                  updateFieldError(
                    'maxLength',
                    tenantSettings.questions.maxLength
                  )
                }}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                  fieldErrors.minLength
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                disabled={saving}
              />
              {fieldErrors.minLength && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.minLength}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="maxLength"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Maximum Length (characters)
              </label>
              <input
                id="maxLength"
                type="number"
                min={10}
                max={5000}
                value={tenantSettings.questions.maxLength}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 2000
                  setTenantSettings({
                    ...tenantSettings,
                    questions: {
                      ...tenantSettings.questions,
                      maxLength: value,
                    },
                  })
                  updateFieldError('maxLength', value)
                  // Also re-validate minLength since they're related
                  updateFieldError(
                    'minLength',
                    tenantSettings.questions.minLength
                  )
                }}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                  fieldErrors.maxLength
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                disabled={saving}
              />
              {fieldErrors.maxLength && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.maxLength}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Min: 1-2000 characters, Max: 10-5000 characters
          </p>
        </div>
      </div>

      {/* User Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            User Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure default settings for new users
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="defaultRole"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Default Role for New Users
            </label>
            <select
              id="defaultRole"
              value={tenantSettings.users.defaultRole}
              onChange={(e) =>
                setTenantSettings({
                  ...tenantSettings,
                  users: {
                    ...tenantSettings.users,
                    defaultRole: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="member">Member (can submit and upvote)</option>
              <option value="moderator">
                Moderator (can moderate content)
              </option>
              <option value="admin">Admin (can manage team)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Role assigned to users when they first join a team
            </p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Security Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure session timeouts and rate limits
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Timeouts */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Session Timeouts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sessionTimeout"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  User Session Timeout (hours)
                </label>
                <input
                  id="sessionTimeout"
                  type="number"
                  min={1}
                  max={720}
                  value={tenantSettings.security.sessionTimeout}
                  onChange={(e) =>
                    setTenantSettings({
                      ...tenantSettings,
                      security: {
                        ...tenantSettings.security,
                        sessionTimeout: parseInt(e.target.value) || 8,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="adminSessionTimeout"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Admin Session Timeout (hours)
                </label>
                <input
                  id="adminSessionTimeout"
                  type="number"
                  min={1}
                  max={720}
                  value={tenantSettings.security.adminSessionTimeout}
                  onChange={(e) =>
                    setTenantSettings({
                      ...tenantSettings,
                      security: {
                        ...tenantSettings.security,
                        adminSessionTimeout: parseInt(e.target.value) || 8,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Range: 1-720 hours (1 hour to 30 days)
            </p>
          </div>

          {/* Rate Limits */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Rate Limits
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="questionsPerHour"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Questions per Hour
                </label>
                <input
                  id="questionsPerHour"
                  type="number"
                  min={1}
                  max={100}
                  value={tenantSettings.security.rateLimits.questionsPerHour}
                  onChange={(e) =>
                    setTenantSettings({
                      ...tenantSettings,
                      security: {
                        ...tenantSettings.security,
                        rateLimits: {
                          ...tenantSettings.security.rateLimits,
                          questionsPerHour: parseInt(e.target.value) || 10,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="upvotesPerMinute"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Upvotes per Minute
                </label>
                <input
                  id="upvotesPerMinute"
                  type="number"
                  min={1}
                  max={200}
                  value={tenantSettings.security.rateLimits.upvotesPerMinute}
                  onChange={(e) =>
                    setTenantSettings({
                      ...tenantSettings,
                      security: {
                        ...tenantSettings.security,
                        rateLimits: {
                          ...tenantSettings.security.rateLimits,
                          upvotesPerMinute: parseInt(e.target.value) || 20,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="responsesPerHour"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Responses per Hour
                </label>
                <input
                  id="responsesPerHour"
                  type="number"
                  min={1}
                  max={50}
                  value={tenantSettings.security.rateLimits.responsesPerHour}
                  onChange={(e) =>
                    setTenantSettings({
                      ...tenantSettings,
                      security: {
                        ...tenantSettings.security,
                        rateLimits: {
                          ...tenantSettings.security.rateLimits,
                          responsesPerHour: parseInt(e.target.value) || 5,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="searchPerMinute"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Searches per Minute
                </label>
                <input
                  id="searchPerMinute"
                  type="number"
                  min={1}
                  max={500}
                  value={tenantSettings.security.rateLimits.searchPerMinute}
                  onChange={(e) =>
                    setTenantSettings({
                      ...tenantSettings,
                      security: {
                        ...tenantSettings.security,
                        rateLimits: {
                          ...tenantSettings.security.rateLimits,
                          searchPerMinute: parseInt(e.target.value) || 30,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Adjust limits to prevent abuse while allowing normal usage
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons (Global) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || hasValidationErrors}
            className="px-6 py-2.5 text-white font-medium rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor:
                !hasChanges || saving || hasValidationErrors
                  ? 'rgb(156, 163, 175)' // gray-400 for disabled
                  : themeColors.primary,
            }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
          {hasChanges && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
        {hasChanges && !hasValidationErrors && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            ⚠️ You have unsaved changes
          </p>
        )}
        {hasValidationErrors && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            ❌ Please fix the validation errors above before saving
          </p>
        )}
      </div>
    </div>
  )
}
