import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface PulseStageLogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PulseStageLogo({ className = '', showWordmark = true, size = 'md' }: PulseStageLogoProps) {
  const { isDarkMode } = useTheme();
  
  // Size classes for the logo
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };
  
  const iconSize = sizeClasses[size];
  
  // Choose the appropriate logo based on theme and whether to show wordmark
  // Note: Light logo is used with dark mode, dark logo with light mode
  const logoSrc = showWordmark 
    ? isDarkMode 
      ? '/src/assets/pulsestage-wordmark-tight-light.svg'  // Light logo on dark background
      : '/src/assets/pulsestage-wordmark-tight-dark.svg'   // Dark logo on light background
    : isDarkMode 
      ? '/src/assets/pulsestage-icon-light.svg'            // Light icon on dark background
      : '/src/assets/pulsestage-icon-dark.svg';            // Dark icon on light background
  
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img 
        src={logoSrc}
        alt="PulseStage"
        className={`${iconSize} ${showWordmark ? 'h-8' : iconSize}`}
      />
    </Link>
  );
}
