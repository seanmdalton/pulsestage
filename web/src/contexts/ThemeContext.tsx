/**
 * Theme Context
 * Manages theme selection and light/dark mode
 */

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Theme, ThemeName } from '../lib/themes'
import { getTheme, applyTheme } from '../lib/themes'
import { apiClient } from '../lib/api'

type ColorMode = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  themeName: ThemeName
  colorMode: ColorMode
  setTheme: (themeName: ThemeName) => void
  toggleColorMode: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const COLOR_MODE_KEY = 'pulsestage-color-mode'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('refined-teal')
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem(COLOR_MODE_KEY) as ColorMode
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark'
    }
    return 'light'
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from tenant settings
  useEffect(() => {
    const loadThemeFromSettings = async () => {
      try {
        const response = await apiClient.getTenantSettings()
        if (response.settings.branding?.theme) {
          setThemeName(response.settings.branding.theme as ThemeName)
        }
      } catch (error) {
        console.warn(
          'Failed to load theme from settings, using default:',
          error
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadThemeFromSettings()
  }, [])

  // Apply theme whenever theme or color mode changes
  useEffect(() => {
    const theme = getTheme(themeName)
    applyTheme(theme, colorMode)

    // Update HTML class for Tailwind dark mode
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeName, colorMode])

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(COLOR_MODE_KEY)) {
        setColorMode(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleColorMode = () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light'
    setColorMode(newMode)
    localStorage.setItem(COLOR_MODE_KEY, newMode)
  }

  const theme = getTheme(themeName)

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName,
        colorMode,
        setTheme: setThemeName,
        toggleColorMode,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
