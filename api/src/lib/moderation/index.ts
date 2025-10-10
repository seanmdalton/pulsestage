import { moderateWithLocalFilter } from './localFilter.js';
import { moderateWithOpenAI } from './openaiFilter.js';
import type { ModerationResult } from './localFilter.js';

export interface CombinedModerationResult {
  flagged: boolean;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
  providers: ('local' | 'openai')[];
}

/**
 * Moderate content using cascading filters
 *
 * Flow:
 * 1. Always run local filter (no configuration needed)
 * 2. If OPENAI_API_KEY is set, also run OpenAI moderation
 * 3. Content is flagged if EITHER filter flags it
 * 4. Reasons are combined from both filters
 *
 * @param text - Content to moderate
 * @returns Combined moderation result
 */
export async function moderateContent(text: string): Promise<CombinedModerationResult> {
  // Always run local filter
  const localResult = await moderateWithLocalFilter(text);

  // Try OpenAI if configured
  const openaiResult = await moderateWithOpenAI(text);

  // Combine results
  const providers: ('local' | 'openai')[] = ['local'];
  const allReasons: string[] = [...localResult.reasons];

  if (openaiResult) {
    providers.push('openai');
    // Add OpenAI reasons, avoiding duplicates
    openaiResult.reasons.forEach(reason => {
      if (!allReasons.includes(reason)) {
        allReasons.push(reason);
      }
    });
  }

  // Content is flagged if either filter flags it
  const flagged = openaiResult ? localResult.flagged || openaiResult.flagged : localResult.flagged;

  // Confidence is the highest of the two
  const confidence =
    openaiResult && openaiResult.confidence === 'high'
      ? 'high'
      : localResult.confidence === 'high'
        ? 'high'
        : openaiResult && openaiResult.confidence === 'medium'
          ? 'medium'
          : localResult.confidence === 'medium'
            ? 'medium'
            : 'low';

  // Log moderation result
  if (flagged) {
    console.warn('Content flagged by moderation:', {
      providers,
      reasons: allReasons,
      confidence,
      preview: text.substring(0, 100),
    });
  }

  return {
    flagged,
    reasons: allReasons,
    confidence,
    providers,
  };
}

// Re-export types
export type { ModerationResult } from './localFilter.js';
