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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SubmitPage } from './pages/SubmitPage'
import { OpenQuestionsPage } from './pages/OpenQuestionsPage'
import { AnsweredQuestionsPage } from './pages/AnsweredQuestionsPage'
import { QuestionsPage } from './pages/QuestionsPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminPage } from './pages/AdminPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AuditPage } from './pages/AuditPage'
import { PresentationPage } from './pages/PresentationPage'
import { ProfilePage } from './pages/ProfilePage'
import { HealthDashboardPage } from './pages/HealthDashboardPage'
import { QuestionDetailPage } from './pages/QuestionDetailPage'
import { ModeratorDashboardPage } from './pages/ModeratorDashboardPage'
import { ModerationQueuePage } from './pages/ModerationQueuePage'
import { ExportPage } from './pages/ExportPage'
import { LoginPage } from './pages/LoginPage'
import { PulseDashboardPage } from './pages/PulseDashboardPage'
import { PulseSettingsPage } from './pages/PulseSettingsPage'
import { PulseRespondPage } from './pages/PulseRespondPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { Navbar } from './components/Navbar'
import { SmartRedirect } from './components/SmartRedirect'
import { SetupWizard } from './components/SetupWizard'
import { DemoModeBanner } from './components/DemoModeBanner'
import { AuthGuard } from './components/AuthGuard'
import { AdminProvider } from './contexts/AdminContext'
import { TeamProvider } from './contexts/TeamContext'
import { UserProvider } from './contexts/UserContext'
import { useTheme } from './contexts/ThemeContext'
import { useEffect, useState } from 'react'
import { getBaseTitle } from './utils/titleUtils'
import { apiClient } from './lib/api'

function AppContent() {
  const { theme, colorMode } = useTheme()
  const themeColors = colorMode === 'light' ? theme.light : theme.dark
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [checkingSetup, setCheckingSetup] = useState(true)

  // Check if setup is needed on app load
  useEffect(() => {
    async function checkSetupStatus() {
      try {
        const status = await apiClient.getSetupStatus()
        setNeedsSetup(status.needsSetup)
      } catch (error) {
        console.error('Failed to check setup status:', error)
        // On error, assume setup is not needed to allow app to load
        setNeedsSetup(false)
      } finally {
        setCheckingSetup(false)
      }
    }

    checkSetupStatus()
  }, [])

  // Set default page title
  useEffect(() => {
    document.title = getBaseTitle()
  }, [])

  // Show loading state while checking setup
  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show setup wizard if needed
  if (needsSetup) {
    return <SetupWizard onComplete={() => setNeedsSetup(false)} />
  }

  return (
    <Router>
      <UserProvider>
        <AdminProvider>
          <TeamProvider>
            <Routes>
              {/* Public routes - no authentication required */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected standalone routes (no navbar, but require auth) */}
              <Route
                path="/onboarding"
                element={
                  <AuthGuard>
                    <OnboardingPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/:teamSlug/open/present"
                element={
                  <AuthGuard>
                    <PresentationPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/all/open/present"
                element={
                  <AuthGuard>
                    <PresentationPage />
                  </AuthGuard>
                }
              />

              {/* Protected routes with navbar - require authentication */}
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <div
                      className="min-h-screen transition-colors"
                      style={{
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      <Navbar />
                      <DemoModeBanner />
                      <Routes>
                        {/* Default routes - smart redirect to user's default team or /all */}
                        <Route
                          path="/"
                          element={
                            <SmartRedirect fallbackTo="/all/dashboard" />
                          }
                        />

                        {/* Legacy redirects - maintain backward compatibility */}
                        <Route
                          path="/open"
                          element={
                            <SmartRedirect fallbackTo="/all/questions?view=open" />
                          }
                        />
                        <Route
                          path="/answered"
                          element={
                            <SmartRedirect fallbackTo="/all/questions?view=answered" />
                          }
                        />

                        {/* Team-based routes */}
                        <Route
                          path="/:teamSlug/dashboard"
                          element={<DashboardPage />}
                        />
                        <Route
                          path="/:teamSlug/questions"
                          element={<QuestionsPage />}
                        />
                        <Route path="/:teamSlug" element={<SubmitPage />} />

                        {/* Legacy team routes - redirect to new consolidated pages */}
                        <Route
                          path="/:teamSlug/open"
                          element={<OpenQuestionsPage />}
                        />
                        <Route
                          path="/:teamSlug/answered"
                          element={<AnsweredQuestionsPage />}
                        />

                        {/* Admin routes (not team-scoped) */}
                        {/* Moderator routes - must come before /:teamSlug */}
                        <Route
                          path="/moderator"
                          element={<ModeratorDashboardPage />}
                        />
                        <Route
                          path="/moderator/queue"
                          element={<ModerationQueuePage />}
                        />
                        <Route
                          path="/moderator/export"
                          element={<ExportPage />}
                        />

                        {/* Admin routes */}
                        <Route path="/admin" element={<AdminPage />} />
                        <Route
                          path="/admin/login"
                          element={<AdminLoginPage />}
                        />
                        <Route path="/admin/audit" element={<AuditPage />} />
                        <Route
                          path="/admin/health"
                          element={<HealthDashboardPage />}
                        />
                        <Route
                          path="/admin/pulse/settings"
                          element={<PulseSettingsPage />}
                        />

                        {/* Pulse routes (team-scoped, like Q&A) */}
                        <Route
                          path="/:teamSlug/pulse/dashboard"
                          element={<PulseDashboardPage />}
                        />
                        <Route
                          path="/pulse/respond"
                          element={<PulseRespondPage />}
                        />

                        {/* Profile routes (not team-scoped) */}
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route
                          path="/profile/questions"
                          element={<ProfilePage />}
                        />

                        {/* Question detail route */}
                        <Route
                          path="/questions/:id"
                          element={<QuestionDetailPage />}
                        />
                      </Routes>
                    </div>
                  </AuthGuard>
                }
              />
            </Routes>
          </TeamProvider>
        </AdminProvider>
      </UserProvider>
    </Router>
  )
}

// Wrap AppContent with Router since we need it before useTheme
function App() {
  return <AppContent />
}

export default App
