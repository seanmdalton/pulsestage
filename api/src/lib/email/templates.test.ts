/**
 * Email Template Tests
 */

import { describe, it, expect } from 'vitest';
import { renderQuestionAnsweredEmail, renderEmail } from './templates.js';
import QuestionAnsweredEmail from '../../emails/QuestionAnsweredEmail.js';

describe('Email Templates', () => {
  describe('renderQuestionAnsweredEmail', () => {
    it('should render QuestionAnsweredEmail template', async () => {
      const html = await renderQuestionAnsweredEmail({
        userName: 'Alice',
        questionBody: 'How do I reset my password?',
        answerBody: 'You can reset your password by...',
        responderName: 'Bob (Moderator)',
        questionUrl: 'https://pulsestage.dev/questions/123',
        unsubscribeUrl: 'https://pulsestage.dev/unsubscribe/abc',
      });

      expect(html).toContain('Alice');
      expect(html).toContain('How do I reset my password?');
      expect(html).toContain('You can reset your password by...');
      expect(html).toContain('Bob (Moderator)');
      expect(html).toContain('https://pulsestage.dev/questions/123');
    });

    it('should include all required sections', async () => {
      const html = await renderQuestionAnsweredEmail({
        userName: 'Test User',
        questionBody: 'Test question',
        answerBody: 'Test answer',
        responderName: 'Moderator',
        questionUrl: 'https://example.com',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      // Check for key sections
      expect(html).toContain('Your Question Was Answered');
      expect(html).toContain('Your Question:');
      expect(html).toContain('Answer:');
      expect(html).toContain('View Full Answer');
      expect(html).toContain('PulseStage');
    });

    it('should handle long question and answer text', async () => {
      const longQuestion = 'A'.repeat(500);
      const longAnswer = 'B'.repeat(1000);

      const html = await renderQuestionAnsweredEmail({
        userName: 'User',
        questionBody: longQuestion,
        answerBody: longAnswer,
        responderName: 'Mod',
        questionUrl: 'https://example.com',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      expect(html).toContain(longQuestion);
      expect(html).toContain(longAnswer);
    });

    it('should handle special characters in content', async () => {
      const html = await renderQuestionAnsweredEmail({
        userName: 'Alice & Bob',
        questionBody: 'How to use <script> tags?',
        answerBody: 'Avoid using "scripts" directly',
        responderName: "O'Connor",
        questionUrl: 'https://example.com?q=test&foo=bar',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      // React Email should escape HTML
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });
  });

  describe('renderEmail', () => {
    it('should render both HTML and plain text', async () => {
      const { html, text } = await renderEmail(QuestionAnsweredEmail, {
        userName: 'Alice',
        questionBody: 'Test question',
        answerBody: 'Test answer',
        responderName: 'Bob',
        questionUrl: 'https://example.com',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      expect(html).toContain('<html');
      expect(html).toContain('Alice');
      expect(text).toBeDefined();
      expect(text).toContain('Alice');
      // Plain text should not contain HTML tags
      expect(text).not.toContain('<html');
    });

    it('should generate valid HTML', async () => {
      const { html } = await renderEmail(QuestionAnsweredEmail, {
        userName: 'Test',
        questionBody: 'Q',
        answerBody: 'A',
        responderName: 'Mod',
        questionUrl: 'https://example.com',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      // Check for basic HTML structure
      expect(html).toContain('<!DOCTYPE html');
      expect(html).toContain('<head>');
      expect(html).toContain('<body');
      expect(html).toContain('</html>');
    });

    it('should include inline CSS in HTML', async () => {
      const { html } = await renderEmail(QuestionAnsweredEmail, {
        userName: 'Test',
        questionBody: 'Q',
        answerBody: 'A',
        responderName: 'Mod',
        questionUrl: 'https://example.com',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      // React Email should inline CSS styles
      expect(html).toContain('style=');
    });
  });
});
