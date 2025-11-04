/**
 * Email Template Renderer
 *
 * Utilities for rendering React Email templates to HTML
 */

import { render } from '@react-email/components';
import { createElement } from 'react';
import QuestionAnsweredEmail, {
  type QuestionAnsweredEmailProps,
} from '../../emails/QuestionAnsweredEmail.js';
import QuestionApprovedEmail, {
  type QuestionApprovedEmailProps,
} from '../../emails/QuestionApprovedEmail.js';
import QuestionRejectedEmail, {
  type QuestionRejectedEmailProps,
} from '../../emails/QuestionRejectedEmail.js';
import WelcomeEmail, { type WelcomeEmailProps } from '../../emails/WelcomeEmail.js';

/**
 * Render QuestionAnsweredEmail template to HTML
 */
export async function renderQuestionAnsweredEmail(
  props: QuestionAnsweredEmailProps
): Promise<string> {
  const result = await render(createElement(QuestionAnsweredEmail, props));
  return result;
}

/**
 * Render QuestionApprovedEmail template to HTML
 */
export async function renderQuestionApprovedEmail(
  props: QuestionApprovedEmailProps
): Promise<string> {
  const result = await render(createElement(QuestionApprovedEmail, props));
  return result;
}

/**
 * Render QuestionRejectedEmail template to HTML
 */
export async function renderQuestionRejectedEmail(
  props: QuestionRejectedEmailProps
): Promise<string> {
  const result = await render(createElement(QuestionRejectedEmail, props));
  return result;
}

/**
 * Render WelcomeEmail template to HTML
 */
export async function renderWelcomeEmail(props: WelcomeEmailProps): Promise<string> {
  const result = await render(createElement(WelcomeEmail, props));
  return result;
}

/**
 * Render template to both HTML and plain text
 */
export async function renderEmail(
  template: React.ComponentType<any>,
  props: any
): Promise<{ html: string; text: string }> {
  const html = await render(createElement(template, props));
  const text = await render(createElement(template, props), {
    plainText: true,
  });
  return { html, text };
}
