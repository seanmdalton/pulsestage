/**
 * Email Service
 *
 * Factory and utilities for email sending
 * Supports multiple providers: SMTP, Resend
 */

import { SMTPEmailService } from './providers/smtp.js';
import { ResendEmailService } from './providers/resend.js';
import type { IEmailService, EmailServiceConfig } from './types.js';

/**
 * Create an email service instance based on configuration
 */
export function createEmailService(config: EmailServiceConfig): IEmailService {
  switch (config.provider) {
    case 'smtp':
      return new SMTPEmailService(config);
    case 'resend':
      return new ResendEmailService(config);
    default:
      throw new Error(`Unsupported email provider: ${config.provider}`);
  }
}

/**
 * Get email service configuration from environment variables
 */
export function getEmailConfigFromEnv(): EmailServiceConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp') as 'smtp' | 'resend';

  const from = {
    email: process.env.EMAIL_FROM || 'noreply@pulsestage.dev',
    name: process.env.EMAIL_FROM_NAME || 'PulseStage',
  };

  const config: EmailServiceConfig = {
    provider,
    from,
  };

  if (provider === 'smtp') {
    config.smtp = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };
  } else if (provider === 'resend') {
    config.resend = {
      apiKey: process.env.RESEND_API_KEY || '',
    };
  }

  return config;
}

/**
 * Singleton email service instance
 */
let emailServiceInstance: IEmailService | null = null;

/**
 * Get the global email service instance (lazily initialized)
 */
export function getEmailService(): IEmailService {
  if (!emailServiceInstance) {
    const config = getEmailConfigFromEnv();
    emailServiceInstance = createEmailService(config);
  }
  return emailServiceInstance;
}

/**
 * Initialize email service (for testing/explicit setup)
 */
export function initEmailService(config?: EmailServiceConfig): IEmailService {
  const finalConfig = config || getEmailConfigFromEnv();
  emailServiceInstance = createEmailService(finalConfig);
  return emailServiceInstance;
}

/**
 * Reset email service instance (for testing)
 */
export function resetEmailService(): void {
  emailServiceInstance = null;
}
