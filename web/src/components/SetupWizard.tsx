import { useState } from 'react'
import { apiClient } from '../lib/api'

interface SetupWizardProps {
  onComplete: () => void
}

interface ApiError {
  message?: string
}

type SetupStep =
  | 'welcome'
  | 'choose-mode'
  | 'org-setup'
  | 'create-admin'
  | 'create-team'
  | 'loading'
  | 'complete'

export function SetupWizard({
  onComplete: _onComplete, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SetupWizardProps) {
  // Note: onComplete prop available for future use, currently we reload the page instead
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome')
  const [orgName, setOrgName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSlug, setTeamSlug] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [createdAdminEmail, setCreatedAdminEmail] = useState<string | null>(
    null
  )
  const [selectedMode, setSelectedMode] = useState<'demo' | 'default' | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Auto-generate slug from team name
  const handleTeamNameChange = (name: string) => {
    setTeamName(name)
    // Auto-generate slug: lowercase, replace spaces with hyphens
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
    setTeamSlug(autoSlug)
  }

  const handleCreateTeam = async () => {
    setError(null)
    setLoading(true)

    try {
      // Validate inputs
      if (!teamName.trim()) {
        throw new Error('Team name is required')
      }
      if (!teamSlug.trim()) {
        throw new Error('Team slug is required')
      }
      if (!/^[a-z0-9-]+$/.test(teamSlug)) {
        throw new Error(
          'Team slug can only contain lowercase letters, numbers, and hyphens'
        )
      }

      // Create team
      const teamResponse = await apiClient.createSetupTeam({
        name: teamName,
        slug: teamSlug,
        description: teamDescription,
      })

      console.log('✅ Team created:', teamResponse.team)

      // Create admin user for this team
      const adminResponse = await apiClient.createSetupAdminUser({
        name: adminName,
        email: adminEmail,
        teamId: teamResponse.team.id,
      })

      console.log('✅ Admin user created:', adminResponse.user)

      // Store admin email and tenant for SSO page
      setCreatedAdminEmail(adminResponse.user.email)
      // Store tenant slug for SSO test page to filter users
      localStorage.setItem('setup-tenant', 'default')
      // Store admin user info for SSO test page to display
      localStorage.setItem(
        'setup-admin-user',
        JSON.stringify({
          email: adminResponse.user.email,
          name: adminResponse.user.name,
          role: 'owner',
          teams: teamResponse.team.name,
        })
      )

      // Show loading state - API will restart
      setCurrentStep('loading')

      // Wait for API restart (5 seconds to be safe)
      setTimeout(() => {
        setCurrentStep('complete')
      }, 5000)
    } catch (err) {
      const error = err as ApiError
      console.error('Failed to create team/admin:', error)
      setError(
        error.message || 'Failed to create team and admin. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLoadDemoData = async () => {
    setError(null)
    setLoading(true)
    setCurrentStep('loading')

    try {
      const response = await apiClient.loadSetupDemoData()
      console.log('✅ Demo data loaded:', response)

      // Store tenant for SSO page (acme for demo data)
      localStorage.setItem('setup-tenant', 'acme')

      // Show completion message
      setCurrentStep('complete')
    } catch (err) {
      const error = err as ApiError
      console.error('Failed to load demo data:', error)
      setError(
        error.message ||
          'Failed to load demo data. You can continue without it.'
      )
      setCurrentStep('complete')
    } finally {
      setLoading(false)
    }
  }

  const handleOrgSetup = async () => {
    setError(null)
    setLoading(true)

    try {
      // Validate input
      if (!orgName.trim()) {
        throw new Error('Organization name is required')
      }

      // Update tenant name
      await apiClient.updateSetupTenant({
        name: orgName,
      })

      console.log(`✅ Organization name set to: ${orgName}`)

      // Move to admin creation
      setCurrentStep('create-admin')
    } catch (err) {
      const error = err as ApiError
      console.error('Failed to set organization name:', error)
      setError(
        error.message || 'Failed to set organization name. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    setError(null)

    // Just validate and move to team creation
    if (!adminName.trim()) {
      setError('Name is required')
      return
    }
    if (!adminEmail.trim()) {
      setError('Email is required')
      return
    }

    // Store for later (we'll create user after team)
    setCurrentStep('create-team')
  }

  const handleFinish = () => {
    if (selectedMode === 'demo') {
      // Redirect to SSO test page for demo data
      window.location.href = '/sso-test.html'
    } else {
      // Redirect to SSO test page with admin email
      if (createdAdminEmail) {
        // Store the user in localStorage so SSO test page can highlight them
        localStorage.setItem('setup-admin-email', createdAdminEmail)
      }
      window.location.href = '/sso-test.html'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-8">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to PulseStage!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Let's get you set up with your first team
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Two ways to get started:
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="mr-2">🎯</span>
                  <span>
                    <strong>Demo Data:</strong> Pre-configured teams and
                    questions for testing
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✨</span>
                  <span>
                    <strong>Default Install:</strong> Create your own team and
                    start fresh
                  </span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentStep('choose-mode')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Choose Mode Step */}
        {currentStep === 'choose-mode' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How would you like to start?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose your setup path
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Demo Data Option */}
              <button
                onClick={() => setSelectedMode('demo')}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  selectedMode === 'demo'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Demo Data
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Perfect for testing and exploration
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>
                    • Pre-configured teams (Engineering, Product, Marketing)
                  </li>
                  <li>• Sample questions and answers</li>
                  <li>• Multiple test users to try different roles</li>
                  <li>• Example tags and workflows</li>
                </ul>
              </button>

              {/* Default Install Option */}
              <button
                onClick={() => setSelectedMode('default')}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  selectedMode === 'default'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Default Install
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Start fresh with your own setup
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Create your first team</li>
                  <li>• Clean slate, no sample data</li>
                  <li>• Ready for production use</li>
                  <li>• Add your own content</li>
                </ul>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('welcome')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (selectedMode === 'demo') {
                    handleLoadDemoData()
                  } else if (selectedMode === 'default') {
                    setCurrentStep('org-setup')
                  }
                }}
                disabled={!selectedMode}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Create Team Step */}
        {currentStep === 'create-team' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Your First Team
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Teams help you organize Q&A sessions by department, project, or
                topic
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="teamName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Team Name *
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  placeholder="e.g., Engineering, Product, All Hands"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="teamSlug"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Team Slug * (URL-friendly identifier)
                </label>
                <input
                  id="teamSlug"
                  type="text"
                  value={teamSlug}
                  onChange={(e) => setTeamSlug(e.target.value.toLowerCase())}
                  placeholder="e.g., engineering, product, all-hands"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div>
                <label
                  htmlFor="teamDescription"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="What's this team for?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('create-admin')}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={loading || !teamName.trim() || !teamSlug.trim()}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Organization Setup Step */}
        {currentStep === 'org-setup' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Name Your Organization
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                What should we call your organization?
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Organization Name *
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Corporation, My Company"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                  autoFocus
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This will appear in the header and throughout the application.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('choose-mode')}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleOrgSetup}
                disabled={loading || !orgName.trim()}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Next: Create Admin'}
              </button>
            </div>
          </div>
        )}

        {/* Create Admin Step */}
        {currentStep === 'create-admin' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Your Admin Account
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Set up your owner account
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="adminName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Your Name *
                </label>
                <input
                  id="adminName"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="adminEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Your Email *
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g., john@mycompany.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={255}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You'll be the <strong>owner</strong> of this team with
                      full admin privileges. You can add more users and
                      configure authentication later.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('org-setup')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={!adminName.trim() || !adminEmail.trim()}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Create Team
              </button>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {currentStep === 'loading' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {selectedMode === 'demo'
                ? 'Loading Demo Data...'
                : 'Setting Up Your Account...'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {selectedMode === 'demo'
                ? 'Creating teams, users, and sample questions. This may take a moment.'
                : 'Creating your team and account. The system will restart briefly.'}
            </p>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Setup Complete! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Your team is ready to use
              </p>
            </div>

            {selectedMode === 'demo' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ✅ Demo Data Loaded!
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                  The API has automatically restarted to load your demo users.
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Click below to reload the page and start exploring with demo
                  data!
                </p>
              </div>
            )}

            {error && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 text-left">
                <p className="text-orange-800 dark:text-orange-200 text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                {selectedMode === 'demo'
                  ? 'Next: Choose a demo user'
                  : 'Next: Sign in as owner'}
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                {selectedMode === 'demo' ? (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">1️⃣</span>
                      <span>Select a demo user to sign in</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2️⃣</span>
                      <span>Explore pre-populated teams and questions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3️⃣</span>
                      <span>Try out moderation and presentation features</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">1️⃣</span>
                      <span>Sign in with your new admin account</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2️⃣</span>
                      <span>Start submitting questions to your team</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3️⃣</span>
                      <span>Invite team members and configure settings</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              {selectedMode === 'demo'
                ? 'Go to User Selection'
                : 'Sign In as Owner'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
