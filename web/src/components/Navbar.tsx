import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { TeamSelector } from './TeamSelector'
import { UserProfile } from './UserProfile'
import { PulseStageLogo } from './PulseStageLogo'
import { useTeam, getTeamSlug } from '../contexts/TeamContext'
import { useTheme } from '../contexts/ThemeContext'

export function Navbar() {
  const location = useLocation()
  const { currentTeam } = useTeam()
  const { theme, colorMode } = useTheme()

  // Get current theme colors
  const themeColors = colorMode === 'light' ? theme.light : theme.dark

  // Generate team-aware navigation items
  const teamSlug = getTeamSlug(currentTeam)
  const navItems = [
    { path: `/${teamSlug}/dashboard`, label: 'Dashboard', icon: '📊' },
    { path: `/${teamSlug}/questions`, label: 'Questions', icon: '💬' },
    { path: `/${teamSlug}/pulse/dashboard`, label: 'Pulse', icon: '💙' },
  ]

  // Helper function to check if a nav item is active
  const isActiveNavItem = (itemPath: string) => {
    // Special handling for questions page (matches both /questions and legacy /open, /answered)
    if (itemPath.endsWith('/questions')) {
      return (
        location.pathname === itemPath ||
        location.pathname.includes('/open') ||
        location.pathname.includes('/answered')
      )
    }
    // Special handling for dashboard (matches both /dashboard and root team path)
    if (itemPath.endsWith('/dashboard') && !itemPath.startsWith('/pulse')) {
      return (
        location.pathname === itemPath ||
        location.pathname === `/${teamSlug}` ||
        location.pathname === '/'
      )
    }
    // Pulse is team-specific (like other pages)
    if (itemPath.endsWith('/pulse/dashboard')) {
      return location.pathname.includes('/pulse')
    }
    return location.pathname === itemPath
  }

  return (
    <nav
      className="sticky top-0 z-50 shadow-sm border-b"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* PulseStage Logo */}
            <PulseStageLogo size="md" showWordmark={true} className="mr-4" />

            {/* Team Selector */}
            <TeamSelector />

            {/* Navigation Items */}
            <div className="flex space-x-6">
              {navItems.map((item) => {
                const isActive = isActiveNavItem(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? ''
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-pulse-surface'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${themeColors.primary}1A`, // 1A = 10% opacity
                            color: themeColors.primary,
                          }
                        : undefined
                    }
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  )
}
