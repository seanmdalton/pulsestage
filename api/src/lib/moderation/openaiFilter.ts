import OpenAI from 'openai';
import type { ModerationResult } from './localFilter.js';

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client (lazy initialization)
 */
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Moderate content using OpenAI's Moderation API
 * Only runs if OPENAI_API_KEY is configured
 *
 * @see https://platform.openai.com/docs/guides/moderation
 */
export async function moderateWithOpenAI(text: string): Promise<ModerationResult | null> {
  const client = getOpenAIClient();

  if (!client) {
    // No API key configured, skip OpenAI moderation
    return null;
  }

  try {
    const moderation = await client.moderations.create({
      model: 'text-moderation-latest',
      input: text,
    });

    const result = moderation.results[0];
    const reasons: string[] = [];

    // Map OpenAI categories to human-readable reasons
    if (result.categories.hate) {
      reasons.push('Hate speech detected');
    }
    if (result.categories['hate/threatening']) {
      reasons.push('Threatening hate speech detected');
    }
    if (result.categories.harassment) {
      reasons.push('Harassment detected');
    }
    if (result.categories['harassment/threatening']) {
      reasons.push('Threatening harassment detected');
    }
    if (result.categories['self-harm']) {
      reasons.push('Self-harm content detected');
    }
    if (result.categories['self-harm/intent']) {
      reasons.push('Self-harm intent detected');
    }
    if (result.categories['self-harm/instructions']) {
      reasons.push('Self-harm instructions detected');
    }
    if (result.categories.sexual) {
      reasons.push('Sexual content detected');
    }
    if (result.categories['sexual/minors']) {
      reasons.push('Sexual content involving minors detected');
    }
    if (result.categories.violence) {
      reasons.push('Violent content detected');
    }
    if (result.categories['violence/graphic']) {
      reasons.push('Graphic violent content detected');
    }

    // Determine confidence based on category scores
    const maxScore = Math.max(
      ...Object.values(result.category_scores).map(score => (typeof score === 'number' ? score : 0))
    );

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (maxScore > 0.8) {
      confidence = 'high';
    } else if (maxScore > 0.5) {
      confidence = 'medium';
    }

    return {
      flagged: result.flagged,
      reasons,
      confidence,
    };
  } catch (error) {
    console.error('OpenAI moderation API error:', error);
    // Fail gracefully - return null to fall back to local filtering only
    return null;
  }
}
