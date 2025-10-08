/**
 * Resend Email Provider
 *
 * Implementation of email service using Resend API
 * Modern, developer-friendly email service with excellent DX
 * https://resend.com
 */

import { Resend } from 'resend';
import type {
  IEmailService,
  EmailOptions,
  EmailSendResult,
  EmailServiceConfig,
  EmailAddress,
} from '../types.js';

export class ResendEmailService implements IEmailService {
  private client: Resend;
  private from: EmailServiceConfig['from'];

  constructor(config: EmailServiceConfig) {
    if (!config.resend?.apiKey) {
      throw new Error('Resend API key is required');
    }

    this.from = config.from;
    this.client = new Resend(config.resend.apiKey);
  }

  private formatAddress(addr: EmailAddress): string {
    return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    try {
      const from = options.from || this.from;

      const { data, error } = await this.client.emails.send({
        from: this.formatAddress(from),
        to: Array.isArray(options.to)
          ? options.to.map(addr => this.formatAddress(addr))
          : this.formatAddress(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo ? this.formatAddress(options.replyTo) : undefined,
        cc: options.cc?.map(addr => this.formatAddress(addr)),
        bcc: options.bcc?.map(addr => this.formatAddress(addr)),
      });

      if (error) {
        console.error('Resend email send failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Resend email send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      // Resend doesn't have a dedicated verification endpoint,
      // but we can check if we can fetch API keys
      const { data, error } = await this.client.apiKeys.list();
      return !error && !!data;
    } catch (error) {
      console.error('Resend verification failed:', error);
      return false;
    }
  }
}
