/**
 * Weekly Pulse Controller
 * Express route handlers for Pulse endpoints
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getPulseSummary } from './service.js';
import { submitPulseResponse, getPulseInviteStatus } from './responseService.js';
import type { PulseSummaryQuery } from './types.js';

/**
 * GET /pulse/summary
 * Returns aggregated Pulse data with anonymity enforcement
 */
export async function handleGetPulseSummary(req: Request, res: Response, prisma: PrismaClient) {
  try {
    const tenantId = req.tenant?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID required',
        message: 'Could not determine tenant from request',
      });
    }

    const range = (req.query.range as string) || '8w';
    const teamId = req.query.team as string | undefined;
    const anonThreshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;

    const query: PulseSummaryQuery = {
      tenantId,
      range,
      teamId,
      anonThreshold,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Fetching Pulse summary with query:', query);
    }

    const summary = await getPulseSummary(prisma, query);

    if (process.env.NODE_ENV === 'development') {
      console.log('[OK] Pulse summary generated:', {
        totalResponses: summary.summary.totalResponses,
        totalInvites: summary.summary.totalInvites,
        participationRate: summary.summary.participationRate,
        questionsReturned: summary.questions.length,
      });
    }

    return res.json(summary);
  } catch (error) {
    console.error('Error fetching Pulse summary:', error);
    return res.status(500).json({
      error: 'Failed to fetch Pulse summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /pulse/respond
 * Displays a confirmation page for one-tap response
 * Query params: token, score
 */
export async function handleGetPulseRespond(req: Request, res: Response, prisma: PrismaClient) {
  try {
    const { token, score } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Link</title></head>
          <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1>[ERROR] Invalid Response Link</h1>
            <p>This link appears to be invalid or malformed.</p>
          </body>
        </html>
      `);
    }

    // Get invite status
    const inviteStatus = await getPulseInviteStatus(prisma, token);

    if (!inviteStatus.valid) {
      return res.status(404).send(`
        <html>
          <head><title>Link Not Found</title></head>
          <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1>[ERROR] Link Not Found</h1>
            <p>This response link could not be found. It may have been deleted or never existed.</p>
          </body>
        </html>
      `);
    }

    // If already completed
    if (inviteStatus.alreadyCompleted) {
      return res.send(`
        <html>
          <head><title>Already Responded</title></head>
          <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1>[OK] Thank You!</h1>
            <p>You have already responded to this question:</p>
            <blockquote style="background: #f3f4f6; padding: 16px; border-left: 4px solid #3b82f6; margin: 24px 0;">
              ${inviteStatus.questionText}
            </blockquote>
            <p style="color: #6b7280;">Your response was recorded and is being used to improve the workplace.</p>
          </body>
        </html>
      `);
    }

    // If expired
    if (inviteStatus.expired) {
      return res.send(`
        <html>
          <head><title>Link Expired</title></head>
          <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1>⏰ Link Expired</h1>
            <p>This response link has expired.</p>
            <blockquote style="background: #f3f4f6; padding: 16px; border-left: 4px solid #f59e0b; margin: 24px 0;">
              ${inviteStatus.questionText}
            </blockquote>
            <p style="color: #6b7280;">You'll receive a new pulse question in the next scheduled cycle.</p>
          </body>
        </html>
      `);
    }

    // If no score provided, show the question
    if (!score) {
      return res.send(`
        <html>
          <head><title>Weekly Pulse</title></head>
          <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1 style="text-align: center;">Your Weekly Pulse </h1>
            <p style="text-align: center; color: #6b7280;">Take 5 seconds to share how you're feeling.</p>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 8px;">
              <p style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 0;">
                ${inviteStatus.questionText}
              </p>
            </div>
            <form method="POST" action="/pulse/respond" style="text-align: center;">
              <input type="hidden" name="token" value="${token}" />
              <p style="color: #6b7280; font-size: 14px;">Click the number that best represents your answer:</p>
              <div style="margin: 24px 0;">
                ${
                  inviteStatus.scale === 'LIKERT_1_5'
                    ? generateLikertButtons(token)
                    : generateNPSButtons(token)
                }
              </div>
              <p style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 14px; color: #15803d;">
                 <strong>Your response is anonymous.</strong> Individual responses are never shared.
              </p>
            </form>
          </body>
        </html>
      `);
    }

    // If score provided, submit immediately (one-tap response)
    const scoreNum = parseInt(score as string);
    const result = await submitPulseResponse(prisma, {
      token,
      score: scoreNum,
    });

    if (!result.success) {
      return res.status(400).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1>[ERROR] ${result.message}</h1>
            <p style="color: #6b7280;">${result.error}</p>
          </body>
        </html>
      `);
    }

    return res.send(`
      <html>
        <head><title>Thank You!</title></head>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
          <h1>[OK] Thank You!</h1>
          <p style="font-size: 18px;">Your response has been recorded.</p>
          <blockquote style="background: #f3f4f6; padding: 16px; border-left: 4px solid #3b82f6; margin: 24px 0;">
            ${result.questionText}
          </blockquote>
          <p style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0; color: #15803d;">
            Your feedback helps us build a better workplace. 🙏
          </p>
          <p style="color: #9ca3af; font-size: 12px;">You can close this window now.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling Pulse response:', error);
    return res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
          <h1>[ERROR] Something Went Wrong</h1>
          <p>We couldn't process your response. Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
}

/**
 * POST /pulse/respond
 * Handles form submission for response (alternative to GET one-tap)
 */
export async function handlePostPulseRespond(req: Request, res: Response, prisma: PrismaClient) {
  try {
    const { token, score, comment } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Token required',
      });
    }

    if (score === undefined || score === null) {
      return res.status(400).json({
        error: 'Score required',
      });
    }

    const result = await submitPulseResponse(prisma, {
      token,
      score: parseInt(score),
      comment,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Error submitting Pulse response:', error);
    return res.status(500).json({
      error: 'Failed to submit response',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Helper functions for generating HTML buttons
function generateLikertButtons(token: string): string {
  const options = [
    { score: 1, emoji: '😞', color: '#ef4444' },
    { score: 2, emoji: '😕', color: '#f97316' },
    { score: 3, emoji: '😐', color: '#eab308' },
    { score: 4, emoji: '🙂', color: '#84cc16' },
    { score: 5, emoji: '😄', color: '#22c55e' },
  ];

  return options
    .map(
      opt => `
    <a href="/pulse/respond?token=${token}&score=${opt.score}" 
       style="display: inline-block; margin: 4px; padding: 12px 16px; min-width: 60px; 
              background-color: ${opt.color}; color: white; text-decoration: none; 
              border-radius: 8px; font-weight: bold;">
      <span style="font-size: 24px;">${opt.emoji}</span><br/>
      <span style="font-size: 16px;">${opt.score}</span>
    </a>
  `
    )
    .join('');
}

function generateNPSButtons(token: string): string {
  const options = Array.from({ length: 11 }, (_, i) => ({
    score: i,
    color: i <= 3 ? '#ef4444' : i <= 6 ? '#eab308' : '#22c55e',
  }));

  return options
    .map(
      opt => `
    <a href="/pulse/respond?token=${token}&score=${opt.score}" 
       style="display: inline-block; margin: 2px; padding: 8px 12px; min-width: 45px; 
              background-color: ${opt.color}; color: white; text-decoration: none; 
              border-radius: 6px; font-weight: bold; font-size: 14px;">
      ${opt.score}
    </a>
  `
    )
    .join('');
}
