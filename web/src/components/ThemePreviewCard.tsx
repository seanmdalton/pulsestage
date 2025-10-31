/**
 * Theme Preview Card
 * Displays a visual preview of a theme with light/dark modes
 */

import type { Theme } from '../lib/themes'

interface ThemePreviewCardProps {
  theme: Theme
  isSelected: boolean
  onSelect: () => void
}

export function ThemePreviewCard({
  theme,
  isSelected,
  onSelect,
}: ThemePreviewCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-lg border-2 transition-all hover:shadow-lg ${
        isSelected
          ? 'ring-2'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      style={
        isSelected
          ? {
              borderColor: 'var(--color-primary)',
              boxShadow: `0 0 0 3px ${theme.light.primary}33`, // 33 = 20% opacity
            }
          : undefined
      }
    >
      {/* Selected badge */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 text-white text-xs font-medium px-2 py-1 rounded-full z-10"
          style={{ backgroundColor: theme.light.primary }}
        >
          ✓ Active
        </div>
      )}

      {/* Theme info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {theme.displayName}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {theme.description}
        </p>
      </div>

      {/* Color preview - Light and Dark modes side by side */}
      <div className="grid grid-cols-2">
        {/* Light mode preview */}
        <div className="p-3 space-y-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Light Mode
          </div>
          <div
            className="h-20 rounded-md p-3 flex flex-col justify-between"
            style={{ backgroundColor: theme.light.background }}
          >
            <div className="flex gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.light.primary }}
                title="Primary"
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.light.secondary }}
                title="Secondary"
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.light.accent }}
                title="Accent"
              />
            </div>
            <div
              className="h-1 rounded"
              style={{ backgroundColor: theme.light.border }}
            />
          </div>
        </div>

        {/* Dark mode preview */}
        <div className="p-3 space-y-2 border-l border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Dark Mode
          </div>
          <div
            className="h-20 rounded-md p-3 flex flex-col justify-between"
            style={{ backgroundColor: theme.dark.background }}
          >
            <div className="flex gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.dark.primary }}
                title="Primary"
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.dark.secondary }}
                title="Secondary"
              />
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.dark.accent }}
                title="Accent"
              />
            </div>
            <div
              className="h-1 rounded"
              style={{ backgroundColor: theme.dark.border }}
            />
          </div>
        </div>
      </div>
    </button>
  )
}
