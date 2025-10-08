/**
 * Resend Email Provider Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendEmailService } from './resend.js';
import type { EmailServiceConfig } from '../types.js';

// Mock functions
const mockSend = vi.fn();
const mockList = vi.fn();

// Mock Resend SDK
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
    apiKeys: {
      list: mockList,
    },
  })),
}));

describe('ResendEmailService', () => {
  let service: ResendEmailService;
  let config: EmailServiceConfig;

  beforeEach(() => {
    // Reset mocks
    mockSend.mockReset();
    mockList.mockReset();

    // Set default successful behaviors
    mockSend.mockResolvedValue({
      data: { id: 'test-email-id-123' },
      error: null,
    });
    mockList.mockResolvedValue({
      data: [{ id: 'key1' }],
      error: null,
    });

    config = {
      provider: 'resend',
      from: {
        email: 'noreply@pulsestage.dev',
        name: 'PulseStage',
      },
      resend: {
        apiKey: 're_test_api_key_123',
      },
    };
    service = new ResendEmailService(config);
  });

  describe('constructor', () => {
    it('should throw error if Resend API key is missing', () => {
      const invalidConfig = {
        provider: 'resend' as const,
        from: { email: 'test@example.com' },
      };

      expect(() => new ResendEmailService(invalidConfig)).toThrow('Resend API key is required');
    });

    it('should create Resend service with valid config', () => {
      expect(service).toBeInstanceOf(ResendEmailService);
    });
  });

  describe('send', () => {
    it('should send email successfully', async () => {
      const result = await service.send({
        to: { email: 'user@test.com', name: 'Test User' },
        subject: 'Test Email',
        html: '<p>Hello World</p>',
        text: 'Hello World',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id-123');
      expect(result.error).toBeUndefined();
    });

    it('should send email to multiple recipients', async () => {
      const result = await service.send({
        to: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' },
        ],
        subject: 'Test Email',
        html: '<p>Hello World</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should use custom from address if provided', async () => {
      const result = await service.send({
        from: { email: 'custom@test.com', name: 'Custom Sender' },
        to: { email: 'user@test.com' },
        subject: 'Test Email',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should format addresses with names correctly', async () => {
      const result = await service.send({
        to: { email: 'user@test.com', name: 'John Doe' },
        subject: 'Test Email',
        html: '<p>Hello</p>',
        replyTo: { email: 'reply@test.com', name: 'Reply Team' },
      });

      expect(result.success).toBe(true);
    });

    it('should format addresses without names correctly', async () => {
      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test Email',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should include CC and BCC if provided', async () => {
      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test Email',
        html: '<p>Hello</p>',
        cc: [{ email: 'cc@test.com' }],
        bcc: [{ email: 'bcc@test.com', name: 'BCC User' }],
      });

      expect(result.success).toBe(true);
    });

    it('should handle Resend API error response', async () => {
      // Mock an error response for this specific test
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(result.messageId).toBeUndefined();
    });

    it('should handle exception during send', async () => {
      // Mock an exception for this specific test
      mockSend.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('verify', () => {
    it('should verify Resend connection successfully', async () => {
      const isValid = await service.verify();
      expect(isValid).toBe(true);
    });

    it('should handle verification failure with error response', async () => {
      // Mock an error response for this specific test
      mockList.mockResolvedValueOnce({
        data: null,
        error: { message: 'Unauthorized' },
      });

      const isValid = await service.verify();
      expect(isValid).toBe(false);
    });

    it('should handle verification exception', async () => {
      // Mock an exception for this specific test
      mockList.mockRejectedValueOnce(new Error('Network error'));

      const isValid = await service.verify();
      expect(isValid).toBe(false);
    });
  });
});
