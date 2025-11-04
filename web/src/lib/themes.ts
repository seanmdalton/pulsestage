/**
 * Theme Configuration
 * Defines preset themes with light and dark mode variants
 */

export type ThemeName =
  | 'executive-blue'
  | 'modern-purple'
  | 'refined-teal'
  | 'indigo-professional'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
}

export interface Theme {
  name: ThemeName
  displayName: string
  description: string
  light: ThemeColors
  dark: ThemeColors
}

export const themes: Record<ThemeName, Theme> = {
  'executive-blue': {
    name: 'executive-blue',
    displayName: 'Executive Blue',
    description:
      'Professional and trustworthy. Perfect for corporate environments.',
    light: {
      primary: '#1E40AF', // Deep Professional Blue
      secondary: '#3B82F6', // Bright Blue
      accent: '#10B981', // Success Green
      background: '#FFFFFF', // White
      surface: '#F8FAFC', // Slight gray tint
      text: '#0F172A', // Near black
      textSecondary: '#64748B', // Gray
      border: '#E2E8F0', // Light border
    },
    dark: {
      primary: '#3B82F6', // Bright Blue
      secondary: '#60A5FA', // Lighter Blue
      accent: '#34D399', // Mint Green
      background: '#0F172A', // Slate dark
      surface: '#1E293B', // Elevated surface
      text: '#F1F5F9', // Off-white
      textSecondary: '#94A3B8', // Gray
      border: '#334155', // Dark border
    },
  },
  'modern-purple': {
    name: 'modern-purple',
    displayName: 'Modern Purple',
    description: 'Creative and engaging. Great for innovative teams.',
    light: {
      primary: '#7C3AED', // Vivid Purple
      secondary: '#A78BFA', // Soft Purple
      accent: '#F59E0B', // Warm Amber
      background: '#FFFFFF', // White
      surface: '#FAFAF9', // Warm white
      text: '#1C1917', // Warm black
      textSecondary: '#78716C', // Gray
      border: '#E7E5E4', // Light border
    },
    dark: {
      primary: '#A78BFA', // Soft Purple
      secondary: '#C4B5FD', // Lighter Purple
      accent: '#FCD34D', // Bright Yellow
      background: '#1C1917', // Warm dark
      surface: '#292524', // Warm surface
      text: '#FAFAF9', // Warm white
      textSecondary: '#A8A29E', // Gray
      border: '#44403C', // Dark border
    },
  },
  'refined-teal': {
    name: 'refined-teal',
    displayName: 'Refined Teal',
    description: 'Evolution of the original brand. Modern and polished.',
    light: {
      primary: '#0D9488', // Rich Teal
      secondary: '#14B8A6', // Bright Teal
      accent: '#F97316', // Vibrant Orange
      background: '#FFFFFF', // White
      surface: '#F0FDFA', // Subtle teal tint
      text: '#134E4A', // Dark teal-gray
      textSecondary: '#6B7280', // Gray
      border: '#CCFBF1', // Light teal border
    },
    dark: {
      primary: '#14B8A6', // Bright Teal
      secondary: '#2DD4BF', // Lighter Teal
      accent: '#FB923C', // Warm Orange
      background: '#0F1419', // Deep slate
      surface: '#1A2332', // Elevated surface
      text: '#F0FDFA', // Teal-tinted white
      textSecondary: '#9CA3AF', // Gray
      border: '#134E4A', // Dark teal border
    },
  },
  'indigo-professional': {
    name: 'indigo-professional',
    displayName: 'Indigo Professional',
    description: 'Modern SaaS aesthetic. Technical and sophisticated.',
    light: {
      primary: '#4F46E5', // Indigo
      secondary: '#6366F1', // Bright Indigo
      accent: '#EC4899', // Pink
      background: '#FFFFFF', // White
      surface: '#F9FAFB', // Cool gray
      text: '#111827', // Pure black
      textSecondary: '#6B7280', // Gray
      border: '#E5E7EB', // Light border
    },
    dark: {
      primary: '#6366F1', // Bright Indigo
      secondary: '#818CF8', // Lighter Indigo
      accent: '#F472B6', // Bright Pink
      background: '#0A0A0F', // True dark
      surface: '#18181B', // Zinc surface
      text: '#FAFAFA', // Pure white
      textSecondary: '#A1A1AA', // Gray
      border: '#27272A', // Dark border
    },
  },
}

/**
 * Get theme by name
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name]
}

/**
 * Get all theme names
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[]
}

/**
 * Apply theme colors to CSS custom properties
 */
export function applyTheme(theme: Theme, mode: 'light' | 'dark') {
  const colors = mode === 'light' ? theme.light : theme.dark
  const root = document.documentElement

  // Apply CSS custom properties
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-secondary', colors.secondary)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-background', colors.background)
  root.style.setProperty('--color-surface', colors.surface)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-border', colors.border)

  // Force a repaint by toggling a class
  root.classList.add('theme-changing')
  setTimeout(() => root.classList.remove('theme-changing'), 50)
}
