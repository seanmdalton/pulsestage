/**
 * Moderation tests - standalone, no database required
 * Run with: npm test -- --config=vitest.moderation.config.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { moderateWithLocalFilter } from './localFilter.js';
import { moderateWithOpenAI } from './openaiFilter.js';
import { moderateContent } from './index.js';

describe('Local Filter Moderation', () => {
  describe('Profanity Detection', () => {
    it('should flag content with profanity', async () => {
      const result = await moderateWithLocalFilter('This is some fucking bullshit');
      expect(result.flagged).toBe(true);
      expect(result.reasons).toContain('Contains profanity');
      expect(result.confidence).toBe('high');
    });

    it('should allow clean content', async () => {
      const result = await moderateWithLocalFilter(
        'What is the best way to improve team collaboration?'
      );
      expect(result.flagged).toBe(false);
      expect(result.reasons).toEqual([]);
    });
  });

  describe('Spam Detection', () => {
    it('should flag content with repeated characters or excessive caps', async () => {
      // String with repeated characters or excessive capitalization should be flagged
      const result = await moderateWithLocalFilter('AAAAAAAAAAAA WHY IS THIS HAPPENING');
      expect(result.flagged).toBe(true);
      // Should be flagged for either spam patterns or excessive capitalization
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should flag content with excessive URLs', async () => {
      const result = await moderateWithLocalFilter(
        'Check out http://spam1.com http://spam2.com http://spam3.com http://spam4.com'
      );
      expect(result.flagged).toBe(true);
      expect(result.reasons.some(r => r.includes('Spam detected'))).toBe(true);
    });

    it('should flag content with spam keywords', async () => {
      const result = await moderateWithLocalFilter(
        'Buy now! Limited time offer! Click here for discount!'
      );
      expect(result.flagged).toBe(true);
    });
  });

  describe('Toxic Language Detection', () => {
    it('should flag hate speech', async () => {
      const result = await moderateWithLocalFilter('You are a retard');
      expect(result.flagged).toBe(true);
      expect(result.reasons.some(r => r.includes('hate speech'))).toBe(true);
    });

    it('should flag harmful content', async () => {
      const result = await moderateWithLocalFilter('go kill yourself');
      expect(result.flagged).toBe(true);
      expect(result.reasons.some(r => r.includes('harmful content'))).toBe(true);
    });
  });

  describe('Excessive Capitalization', () => {
    it('should flag shouting (excessive caps)', async () => {
      const result = await moderateWithLocalFilter(
        'WHY IS NOBODY LISTENING TO ME THIS IS TERRIBLE'
      );
      expect(result.flagged).toBe(true);
      expect(result.reasons).toContain('Excessive capitalization');
    });

    it('should allow normal capitalization', async () => {
      const result = await moderateWithLocalFilter('What is the company policy on remote work?');
      expect(result.flagged).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', async () => {
      const result = await moderateWithLocalFilter('');
      expect(result.flagged).toBe(false);
    });

    it('should handle very long text', async () => {
      const longText = 'This is a reasonable question. '.repeat(100);
      const result = await moderateWithLocalFilter(longText);
      expect(result.flagged).toBe(false);
    });

    it('should handle special characters', async () => {
      const result = await moderateWithLocalFilter('What does @#$%^& mean in our codebase?');
      expect(result.flagged).toBe(false);
    });
  });
});

describe('OpenAI Filter Moderation', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    // Reset environment
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env.OPENAI_API_KEY = originalEnv;
  });

  describe('Without API Key', () => {
    it('should return null when no API key is configured', async () => {
      delete process.env.OPENAI_API_KEY;
      const result = await moderateWithOpenAI('test content');
      expect(result).toBeNull();
    });
  });

  describe('With API Key (Integration)', () => {
    it(
      'should work with OpenAI when real API key is provided (skipped if not)',
      async () => {
        // This test only runs if OPENAI_API_KEY is actually configured
        const hasValidKey =
          process.env.OPENAI_API_KEY &&
          !process.env.OPENAI_API_KEY.includes('invalid') &&
          process.env.OPENAI_API_KEY.startsWith('sk-');

        if (!hasValidKey) {
          console.log('⏭  Skipping OpenAI integration test (no valid API key)');
          // Test passes - we're just documenting that it would work with a key
          // Verify the function returns null when no key is set
          const result = await moderateWithOpenAI('test');
          expect(result).toBeNull();
          return;
        }

        // If we have a valid key, test the actual API
        const result = await moderateWithOpenAI('This is a normal, appropriate question.');
        expect(result).not.toBeNull();
        expect(result?.flagged).toBe(false);
      },
      { timeout: 10000 }
    ); // Increase timeout for actual API calls
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Set an invalid API key to trigger an error
      process.env.OPENAI_API_KEY = 'invalid-key-for-testing';

      const result = await moderateWithOpenAI('test content');

      // Should return null on error (graceful degradation)
      expect(result).toBeNull();
    });
  });
});

describe('Combined Moderation', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
  });

  describe('Local Only (No OpenAI Key)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('should use only local filter when no OpenAI key is set', async () => {
      const result = await moderateContent('This is some fucking nonsense');
      expect(result.flagged).toBe(true);
      expect(result.providers).toEqual(['local']);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should allow clean content with local filter only', async () => {
      const result = await moderateContent('What is our vacation policy?');
      expect(result.flagged).toBe(false);
      expect(result.providers).toEqual(['local']);
    });
  });

  describe('Local + OpenAI (With API Key)', () => {
    it('should combine both filters when OpenAI key is set (or skip if no key)', async () => {
      // Check if we have a real API key
      const hasValidKey = originalEnv && !originalEnv.includes('invalid');

      if (!hasValidKey) {
        console.log('⏭  Skipping OpenAI integration test (no valid API key)');
        // Test passes - just verify local works
        const result = await moderateContent('This is a normal question about project deadlines.');
        expect(result.providers).toEqual(['local']);
        expect(result.flagged).toBe(false);
        return;
      }

      // Restore key for this test
      process.env.OPENAI_API_KEY = originalEnv;

      const result = await moderateContent('This is a normal question about project deadlines.');
      expect(result.providers).toContain('local');
      expect(result.providers).toContain('openai');
    });

    it('should flag content if either filter flags it', async () => {
      // This test works with or without OpenAI - local will catch it
      const result = await moderateContent('You are a stupid piece of shit');
      expect(result.flagged).toBe(true);
      // At minimum, local filter should catch this
      expect(result.providers).toContain('local');
      expect(result.providers.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Examples', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY; // Use local only for consistent tests
    });

    it('should allow legitimate questions', async () => {
      const questions = [
        'What is our remote work policy?',
        'How do I submit a PTO request?',
        'When is the next all-hands meeting?',
        'Can someone explain the new benefits package?',
        'Who should I contact about payroll issues?',
      ];

      for (const question of questions) {
        const result = await moderateContent(question);
        expect(result.flagged).toBe(false);
      }
    });

    it('should flag inappropriate questions', async () => {
      const inappropriateQuestions = [
        'Why is management so fucking incompetent?',
        'Check out this amazing deal: http://spam.com http://spam2.com http://spam3.com http://spam4.com',
        'AAAAAAAAAAAAAAAA I HATE THIS PLACE',
        'kill yourself you worthless piece of trash',
      ];

      for (const question of inappropriateQuestions) {
        const result = await moderateContent(question);
        expect(result.flagged).toBe(true);
      }
    });

    it('should handle edge case: critical but appropriate feedback', async () => {
      const result = await moderateContent(
        'I have serious concerns about our workplace safety practices. Can we discuss this?'
      );
      expect(result.flagged).toBe(false);
    });

    it('should handle edge case: passionate but appropriate', async () => {
      const result = await moderateContent(
        'I strongly disagree with this decision and would like to understand the reasoning.'
      );
      expect(result.flagged).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should moderate content quickly (< 100ms for local only)', async () => {
      delete process.env.OPENAI_API_KEY;

      const start = Date.now();
      await moderateContent('This is a test question about performance.');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
