/**
 * Weekly Pulse Service
 * Handles aggregation and anonymity enforcement
 */

import { PrismaClient } from '@prisma/client';
import type {
  PulseSummaryQuery,
  PulseSummaryResponse,
  PulseTrendDataPoint,
  PulseQuestionSummary,
} from './types.js';
import { getTenantSettings } from '../lib/settingsService.js';

/**
 * Parse range string (e.g., '4w', '8w', '12w') to number of weeks
 */
function parseRange(range?: string): number {
  if (!range) return 8; // Default 8 weeks

  const match = range.match(/^(\d+)w$/);
  if (!match) return 8;

  const weeks = parseInt(match[1]);
  return Math.min(Math.max(weeks, 1), 52); // Clamp between 1-52 weeks
}

/**
 * Get start of week for a date (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get Pulse summary with anonymity enforcement
 */
export async function getPulseSummary(
  prisma: PrismaClient,
  query: PulseSummaryQuery
): Promise<PulseSummaryResponse> {
  const { tenantId, range, teamId, anonThreshold: queryThreshold } = query;

  // Get tenant settings for anonymity threshold
  const settings = await getTenantSettings(prisma, tenantId);
  const anonThreshold = queryThreshold ?? settings.pulse?.anonThreshold ?? 5;

  // Parse range
  const weeks = parseRange(range);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Get all active questions for this tenant
  const questions = await prisma.pulseQuestion.findMany({
    where: {
      tenantId,
      active: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Build where clause for team filtering
  const responseWhere: any = {
    tenantId,
    submittedAt: {
      gte: startDate,
    },
  };
  if (teamId) {
    responseWhere.teamId = teamId;
  }

  // Get all responses in the date range (optionally filtered by team)
  const responses = await prisma.pulseResponse.findMany({
    where: responseWhere,
    orderBy: { submittedAt: 'asc' },
  });

  // Build where clause for invite counting
  const inviteWhere: any = {
    tenantId,
    createdAt: {
      gte: startDate,
    },
  };
  if (teamId) {
    inviteWhere.teamId = teamId;
  }

  // Get total invites (for participation calculation, optionally filtered by team)
  const totalInvites = await prisma.pulseInvite.count({
    where: inviteWhere,
  });

  // Build week buckets
  const weekBuckets = new Map<string, Date>();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekKey = formatDate(getWeekStart(weekStart));
    weekBuckets.set(weekKey, getWeekStart(weekStart));
  }

  // Group responses by week and question
  const responsesByWeekAndQuestion = new Map<string, Map<string, number[]>>();

  for (const response of responses) {
    const weekStart = formatDate(getWeekStart(new Date(response.submittedAt)));

    if (!weekBuckets.has(weekStart)) continue; // Outside our range

    if (!responsesByWeekAndQuestion.has(weekStart)) {
      responsesByWeekAndQuestion.set(weekStart, new Map());
    }

    const weekMap = responsesByWeekAndQuestion.get(weekStart)!;
    if (!weekMap.has(response.questionId)) {
      weekMap.set(response.questionId, []);
    }

    weekMap.get(response.questionId)!.push(response.score);
  }

  // Calculate overall trend (across all questions)
  const overallTrend: PulseTrendDataPoint[] = [];

  for (const [weekKey] of weekBuckets) {
    const weekResponses = responsesByWeekAndQuestion.get(weekKey);

    if (!weekResponses) {
      overallTrend.push({
        weekStart: weekKey,
        average: null,
        participation: 0,
        responseCount: 0,
        insufficient: true,
      });
      continue;
    }

    // Aggregate all responses for this week
    const allScores: number[] = [];
    weekResponses.forEach(scores => allScores.push(...scores));

    const count = allScores.length;
    const insufficient = count < anonThreshold;

    overallTrend.push({
      weekStart: weekKey,
      average: insufficient ? null : allScores.reduce((a, b) => a + b, 0) / count,
      participation: (count / (totalInvites / weeks)) * 100, // Rough estimate
      responseCount: count,
      insufficient,
    });
  }

  // Calculate per-question summaries
  const questionSummaries: PulseQuestionSummary[] = [];

  for (const question of questions) {
    const trend: PulseTrendDataPoint[] = [];
    const allResponsesForQuestion: number[] = [];

    for (const [weekKey] of weekBuckets) {
      const weekResponses = responsesByWeekAndQuestion.get(weekKey);
      const scores = weekResponses?.get(question.id) || [];

      const count = scores.length;
      const insufficient = count < anonThreshold;

      if (!insufficient) {
        allResponsesForQuestion.push(...scores);
      }

      trend.push({
        weekStart: weekKey,
        average: insufficient ? null : scores.reduce((a, b) => a + b, 0) / count,
        participation: 0, // Not calculated per-question
        responseCount: count,
        insufficient,
      });
    }

    const overallInsufficient = allResponsesForQuestion.length < anonThreshold;

    questionSummaries.push({
      questionId: question.id,
      questionText: question.text,
      category: question.category,
      scale: question.scale,
      trend,
      overallAverage: overallInsufficient
        ? null
        : allResponsesForQuestion.reduce((a, b) => a + b, 0) / allResponsesForQuestion.length,
      insufficient: overallInsufficient,
    });
  }

  // Build heatmap (category x week)
  const heatmap: PulseSummaryResponse['heatmap'] = {};

  for (const question of questions) {
    const category = question.category || 'uncategorized';

    if (!heatmap[category]) {
      heatmap[category] = {};
    }

    for (const [weekKey] of weekBuckets) {
      const weekResponses = responsesByWeekAndQuestion.get(weekKey);
      const scores = weekResponses?.get(question.id) || [];

      const count = scores.length;
      const insufficient = count < anonThreshold;

      heatmap[category][weekKey] = {
        average: insufficient ? null : scores.reduce((a, b) => a + b, 0) / count,
        insufficient,
      };
    }
  }

  // Calculate overall participation rate
  const totalResponses = responses.length;
  const participationRate = totalInvites > 0 ? (totalResponses / totalInvites) * 100 : 0;

  return {
    tenantId,
    anonThreshold,
    summary: {
      overallTrend,
      participationRate,
      totalResponses,
      totalInvites,
    },
    questions: questionSummaries,
    heatmap,
  };
}
