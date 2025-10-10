/**
 * Demo Mode Authentication Tests
 *
 * Tests the demo mode configuration
 */

import { describe, it, expect } from 'vitest';
import { getDemoModeConfig } from './demoMode.js';

describe('Demo Mode Authentication', () => {
  describe('getDemoModeConfig', () => {
    it('should return demo mode configuration when enabled', () => {
      const config = getDemoModeConfig();

      expect(config.enabled).toBe(true);
      expect(config.users).toHaveLength(4);
      expect(config.users).toContain('alice');
      expect(config.users).toContain('bob');
      expect(config.users).toContain('moderator');
      expect(config.users).toContain('admin');
    });

    it('should return array of allowed demo users', () => {
      const config = getDemoModeConfig();

      expect(Array.isArray(config.users)).toBe(true);
      expect(config.users.every(user => typeof user === 'string')).toBe(true);
    });

    it('should have consistent configuration structure', () => {
      const config = getDemoModeConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('users');
      expect(typeof config.enabled).toBe('boolean');
    });
  });
});
