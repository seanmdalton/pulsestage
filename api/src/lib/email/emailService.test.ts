/**
 * Email Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmailService,
  getEmailConfigFromEnv,
  initEmailService,
  resetEmailService,
  getEmailService,
} from './emailService.js';
import { SMTPEmailService } from './providers/smtp.js';
import { ResendEmailService } from './providers/resend.js';
import type { EmailServiceConfig } from './types.js';

describe('Email Service Factory', () => {
  beforeEach(() => {
    resetEmailService();
  });

  describe('createEmailService', () => {
    it('should create SMTP email service', () => {
      const config: EmailServiceConfig = {
        provider: 'smtp',
        from: { email: 'test@example.com', name: 'Test' },
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          auth: { user: 'user', pass: 'pass' },
        },
      };

      const service = createEmailService(config);
      expect(service).toBeInstanceOf(SMTPEmailService);
    });

    it('should create Resend email service', () => {
      const config: EmailServiceConfig = {
        provider: 'resend',
        from: { email: 'test@example.com', name: 'Test' },
        resend: {
          apiKey: 're_test_key',
        },
      };

      const service = createEmailService(config);
      expect(service).toBeInstanceOf(ResendEmailService);
    });

    it('should throw error for unsupported provider', () => {
      const config = {
        provider: 'invalid' as any,
        from: { email: 'test@example.com' },
      };

      expect(() => createEmailService(config)).toThrow('Unsupported email provider');
    });
  });

  describe('getEmailConfigFromEnv', () => {
    it('should default to SMTP provider', () => {
      const config = getEmailConfigFromEnv();
      expect(config.provider).toBe('smtp');
    });

    it('should read SMTP config from environment', () => {
      process.env.EMAIL_PROVIDER = 'smtp';
      process.env.EMAIL_FROM = 'noreply@test.com';
      process.env.EMAIL_FROM_NAME = 'Test App';
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURE = 'true';
      process.env.SMTP_USER = 'testuser';
      process.env.SMTP_PASS = 'testpass';

      const config = getEmailConfigFromEnv();

      expect(config.provider).toBe('smtp');
      expect(config.from.email).toBe('noreply@test.com');
      expect(config.from.name).toBe('Test App');
      expect(config.smtp?.host).toBe('smtp.test.com');
      expect(config.smtp?.port).toBe(465);
      expect(config.smtp?.secure).toBe(true);
      expect(config.smtp?.auth.user).toBe('testuser');
      expect(config.smtp?.auth.pass).toBe('testpass');
    });

    it('should read Resend config from environment', () => {
      process.env.EMAIL_PROVIDER = 'resend';
      process.env.EMAIL_FROM = 'noreply@test.com';
      process.env.RESEND_API_KEY = 're_test_123';

      const config = getEmailConfigFromEnv();

      expect(config.provider).toBe('resend');
      expect(config.from.email).toBe('noreply@test.com');
      expect(config.resend?.apiKey).toBe('re_test_123');
    });

    it('should use default values when env vars not set', () => {
      delete process.env.EMAIL_PROVIDER;
      delete process.env.EMAIL_FROM;
      delete process.env.EMAIL_FROM_NAME;

      const config = getEmailConfigFromEnv();

      expect(config.provider).toBe('smtp');
      expect(config.from.email).toBe('noreply@pulsestage.dev');
      expect(config.from.name).toBe('PulseStage');
    });
  });

  describe('Email Service Singleton', () => {
    it('should create and return singleton instance', () => {
      const service1 = getEmailService();
      const service2 = getEmailService();

      expect(service1).toBe(service2);
    });

    it('should allow explicit initialization', () => {
      const config: EmailServiceConfig = {
        provider: 'smtp',
        from: { email: 'custom@example.com' },
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          auth: { user: 'user', pass: 'pass' },
        },
      };

      const service = initEmailService(config);
      expect(service).toBeInstanceOf(SMTPEmailService);

      const service2 = getEmailService();
      expect(service2).toBe(service);
    });

    it('should reset singleton instance', () => {
      const service1 = getEmailService();
      resetEmailService();
      const service2 = getEmailService();

      // They're different instances after reset
      expect(service1).not.toBe(service2);
    });
  });
});
