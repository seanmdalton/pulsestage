/**
 * Email Service Types
 *
 * Type definitions for the email service abstraction layer
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  provider: 'smtp' | 'resend';
  from: EmailAddress;
  // SMTP config
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  // Resend config
  resend?: {
    apiKey: string;
  };
}

export interface IEmailService {
  send(options: EmailOptions): Promise<EmailSendResult>;
  verify(): Promise<boolean>;
}
