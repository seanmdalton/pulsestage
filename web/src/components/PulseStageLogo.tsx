import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

interface PulseStageLogoProps {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
  forceTheme?: 'light' | 'dark' // Force a specific theme regardless of context
}

export function PulseStageLogo({
  className = '',
  showWordmark = true,
  size = 'md',
  forceTheme,
}: PulseStageLogoProps) {
  const { colorMode } = useTheme()
  const isDarkMode = forceTheme ? forceTheme === 'dark' : colorMode === 'dark'

  // Size classes for the logo
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  }

  const iconSize = sizeClasses[size]

  // Choose the appropriate logo based on theme and whether to show wordmark
  // Note: Light logo is used with dark mode, dark logo with light mode
  const logoSrc = showWordmark
    ? isDarkMode
      ? '/pulsestage-wordmark-light.svg' // Light logo on dark background
      : '/pulsestage-wordmark-dark.svg' // Dark logo on light background
    : isDarkMode
      ? '/pulsestage-icon-light.svg' // Light icon on dark background
      : '/pulsestage-icon-dark.svg' // Dark icon on light background

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="PulseStage"
        className={`${showWordmark ? 'h-12' : iconSize}`}
      />
    </Link>
  )
}
