/**
 * Email Service - Public API
 *
 * Exports all email service functionality
 */

export * from './types.js';
export * from './emailService.js';
export * from './templates.js';
export { SMTPEmailService } from './providers/smtp.js';
export { ResendEmailService } from './providers/resend.js';
