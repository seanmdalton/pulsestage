/**
 * SMTP Email Provider
 *
 * Implementation of email service using SMTP (via Nodemailer)
 * Suitable for self-hosted deployments or custom mail servers
 */

import nodemailer, { type Transporter } from 'nodemailer';
import type { IEmailService, EmailOptions, EmailSendResult, EmailServiceConfig } from '../types.js';

export class SMTPEmailService implements IEmailService {
  private transporter: Transporter;
  private from: EmailServiceConfig['from'];

  constructor(config: EmailServiceConfig) {
    if (!config.smtp) {
      throw new Error('SMTP configuration is required');
    }

    this.from = config.from;

    // Only include auth if credentials are provided (Mailpit doesn't need auth)
    const transportConfig: any = {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure ?? false,
    };

    if (config.smtp.auth.user && config.smtp.auth.pass) {
      transportConfig.auth = {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      };
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    try {
      const from = options.from || this.from;
      const info = await this.transporter.sendMail({
        from: `${from.name || 'PulseStage'} <${from.email}>`,
        to: Array.isArray(options.to)
          ? options.to.map(addr => `${addr.name || ''} <${addr.email}>`)
          : `${options.to.name || ''} <${options.to.email}>`,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo
          ? `${options.replyTo.name || ''} <${options.replyTo.email}>`
          : undefined,
        cc: options.cc?.map(addr => `${addr.name || ''} <${addr.email}>`),
        bcc: options.bcc?.map(addr => `${addr.name || ''} <${addr.email}>`),
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('SMTP email send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }
}
