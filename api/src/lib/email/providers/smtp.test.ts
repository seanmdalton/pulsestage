/**
 * SMTP Email Provider Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SMTPEmailService } from './smtp.js';
import type { EmailServiceConfig } from '../types.js';

//Mock functions
const mockSendMail = vi.fn();
const mockVerify = vi.fn();

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
      verify: mockVerify,
    })),
  },
}));

describe('SMTPEmailService', () => {
  let service: SMTPEmailService;
  let config: EmailServiceConfig;

  beforeEach(() => {
    // Reset mocks
    mockSendMail.mockReset();
    mockVerify.mockReset();

    // Set default successful behaviors
    mockSendMail.mockResolvedValue({
      messageId: 'test-message-id-123',
    });
    mockVerify.mockResolvedValue(true);

    config = {
      provider: 'smtp',
      from: {
        email: 'noreply@pulsestage.dev',
        name: 'PulseStage',
      },
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      },
    };
    service = new SMTPEmailService(config);
  });

  describe('constructor', () => {
    it('should throw error if SMTP config is missing', () => {
      const invalidConfig = {
        provider: 'smtp' as const,
        from: { email: 'test@example.com' },
      };

      expect(() => new SMTPEmailService(invalidConfig)).toThrow('SMTP configuration is required');
    });

    it('should create SMTP service with valid config', () => {
      expect(service).toBeInstanceOf(SMTPEmailService);
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
      expect(result.messageId).toBe('test-message-id-123');
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

    it('should include reply-to if provided', async () => {
      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test Email',
        html: '<p>Hello</p>',
        replyTo: { email: 'reply@test.com', name: 'Reply Address' },
      });

      expect(result.success).toBe(true);
    });

    it('should include CC and BCC if provided', async () => {
      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test Email',
        html: '<p>Hello</p>',
        cc: [{ email: 'cc@test.com' }],
        bcc: [{ email: 'bcc@test.com' }],
      });

      expect(result.success).toBe(true);
    });

    it('should handle send failure gracefully', async () => {
      // Mock a failing send for this specific test
      mockSendMail.mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await service.send({
        to: { email: 'user@test.com' },
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
      expect(result.messageId).toBeUndefined();
    });
  });

  describe('verify', () => {
    it('should verify SMTP connection successfully', async () => {
      const isValid = await service.verify();
      expect(isValid).toBe(true);
    });

    it('should handle verification failure', async () => {
      // Mock a failing verification for this specific test
      mockVerify.mockRejectedValueOnce(new Error('Invalid credentials'));

      const isValid = await service.verify();
      expect(isValid).toBe(false);
    });
  });
});
