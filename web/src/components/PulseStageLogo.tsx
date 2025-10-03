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
  const logoSrc = showWordmark 
    ? isDarkMode 
      ? '/src/assets/pulsestage-wordmark-dark.svg'
      : '/src/assets/pulsestage-wordmark-light.svg'
    : isDarkMode 
      ? '/src/assets/pulsestage-icon-light.svg'
      : '/src/assets/pulsestage-icon-dark.svg';
  
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
