import { Filter } from 'bad-words';
import nlp from 'compromise';

export interface ModerationResult {
  flagged: boolean;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

// Initialize profanity filter
const profanityFilter = new Filter();

// Spam patterns (regex-based detection)
const spamPatterns = [
  /(.)\1{10,}/i, // Repeated characters (10+ times)
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi, // Multiple URLs
  /\b(buy|cheap|discount|free|click here|limited time|act now|sale|order now)\b/gi, // Spam keywords
  /\b\d{10,}\b/g, // Long numbers (phone numbers, etc.)
];

// Additional toxic patterns not caught by bad-words
const toxicPatterns = [
  /\b(kill yourself|kys|neck yourself)\b/gi,
  /\b(ni(gg|bb)er|f[a@]gg[o0]t|retard)\b/gi,
  /\b(rape|molest|abuse)\b/gi,
];

/**
 * Local content moderation using rule-based filtering
 * Always runs, no configuration needed
 */
export async function moderateWithLocalFilter(text: string): Promise<ModerationResult> {
  const reasons: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 1. Check for profanity
  if (profanityFilter.isProfane(text)) {
    reasons.push('Contains profanity');
    confidence = 'high';
  }

  // 2. Check for spam patterns
  for (const pattern of spamPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 3) {
      // More than 3 matches = likely spam
      reasons.push('Spam detected (excessive URLs, numbers, or repeated characters)');
      confidence = 'high';
      break;
    }
  }

  // 3. Check for explicit toxic language
  for (const pattern of toxicPatterns) {
    if (pattern.test(text)) {
      reasons.push('Contains hate speech or harmful content');
      confidence = 'high';
      break;
    }
  }

  // 4. Check for excessive caps (shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.replace(/\s/g, '').length;
  if (capsRatio > 0.6 && text.length > 20) {
    reasons.push('Excessive capitalization');
    confidence = confidence === 'high' ? 'high' : 'medium';
  }

  // 5. NLP-based sentiment analysis (basic)
  const doc = nlp(text);
  const sentences = doc.sentences().out('array');

  // Check for aggressive imperatives
  const aggressiveCommands = sentences.filter(
    (s: string) => s.includes('!') && (s.toLowerCase().includes('you') || s.length < 20)
  );
  if (aggressiveCommands.length > 2) {
    reasons.push('Aggressive or confrontational tone');
    confidence = confidence === 'high' ? 'high' : 'medium';
  }

  return {
    flagged: reasons.length > 0,
    reasons,
    confidence,
  };
}
