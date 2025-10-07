import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

export function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [orgName, setOrgName] = useState('')
  const [originalOrgName, setOriginalOrgName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')

  // Load settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getAdminSettings()
      setOrgName(response.tenant.name)
      setOriginalOrgName(response.tenant.name)
      setTenantSlug(response.tenant.slug)
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

      // Only update if name changed
      if (orgName.trim() === originalOrgName) {
        setSuccess('No changes to save')
        return
      }

      if (!orgName.trim()) {
        setError('Organization name cannot be empty')
        return
      }

      await apiClient.updateAdminSettings({
        name: orgName.trim(),
      })

      setOriginalOrgName(orgName.trim())
      setSuccess('Settings saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save settings. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setOrgName(originalOrgName)
    setError(null)
    setSuccess(null)
  }

  const hasChanges = orgName.trim() !== originalOrgName

  if (loading) {
    return (
      <div className="max-w-3xl">
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
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Settings
      </h2>

      {/* Organization Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Organization
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your organization's basic information
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Organization Name */}
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

          {/* Tenant Slug (read-only) */}
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

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-800 dark:text-green-200 text-sm">
                {success}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {hasChanges && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Future Settings Sections */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Coming Soon
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Theme customization options</li>
          <li>• Logo upload and branding</li>
          <li>• SSO configuration (when available)</li>
          <li>• Advanced security settings</li>
        </ul>
      </div>
    </div>
  )
}
