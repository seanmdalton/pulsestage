/**
 * User-Specific Pulse Service
 * Handles fetching user's pulse invites and personal history
 */

import { PrismaClient, PulseInviteStatus } from '@prisma/client';

export interface UserPulseInvite {
  id: string;
  token: string;
  questionId: string;
  questionText: string;
  scale: 'LIKERT_1_5' | 'NPS_0_10';
  expiresAt: string; // ISO string for frontend
  createdAt: string; // ISO string for frontend
}

export interface UserPulseHistory {
  weekStart: string;
  responseCount: number;
  averageScore: number | null;
  responses: Array<{
    id: string;
    questionText: string;
    score: number;
    respondedAt: string;
  }>;
}

/**
 * Get pending pulse invites for the current user
 */
export async function getUserPendingInvites(
  prisma: PrismaClient,
  userId: string,
  tenantId: string
): Promise<UserPulseInvite[]> {
  const now = new Date();

  const invites = await prisma.pulseInvite.findMany({
    where: {
      userId,
      tenantId,
      status: {
        in: [PulseInviteStatus.SENT, PulseInviteStatus.PENDING],
      },
      expiresAt: {
        gte: now, // Not expired
      },
    },
    include: {
      question: true,
    },
    orderBy: {
      sentAt: 'desc',
    },
  });

  return invites.map(invite => ({
    id: invite.id,
    token: invite.token,
    questionId: invite.questionId,
    questionText: invite.question.text,
    scale: invite.question.scale,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  }));
}

/**
 * Get user's pulse completion history (last N weeks)
 * Returns weekly aggregated data showing participation (not scores - those are anonymous!)
 * Note: We can only show that the user completed invites, not their actual scores
 */
export async function getUserPulseHistory(
  prisma: PrismaClient,
  userId: string,
  tenantId: string,
  weeks: number = 8
): Promise<UserPulseHistory[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Get user's completed invites from the last N weeks
  const completedInvites = await prisma.pulseInvite.findMany({
    where: {
      tenantId,
      userId,
      status: PulseInviteStatus.COMPLETED,
      completedAt: {
        gte: startDate,
        not: null,
      },
    },
    include: {
      question: true,
    },
    orderBy: {
      completedAt: 'asc',
    },
  });

  // Group by week
  const weekMap = new Map<
    string,
    Array<{
      id: string;
      questionText: string;
      completedAt: Date;
    }>
  >();

  for (const invite of completedInvites) {
    if (!invite.completedAt) continue;

    const weekStart = getWeekStart(invite.completedAt);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }

    weekMap.get(weekKey)!.push({
      id: invite.id,
      questionText: invite.question.text,
      completedAt: invite.completedAt,
    });
  }

  // Convert to array
  const history: UserPulseHistory[] = [];

  // Generate all weeks in the range (even if no responses)
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekStartDate = getWeekStart(weekStart);
    const weekKey = weekStartDate.toISOString().split('T')[0];

    const weekCompletions = weekMap.get(weekKey) || [];

    // Note: We show participation count, but not scores (anonymous)
    // Frontend can display "You completed X pulse check-ins this week"
    history.push({
      weekStart: weekKey,
      responseCount: weekCompletions.length,
      averageScore: null, // Scores are anonymous, can't show user's own
      responses: weekCompletions.map(c => ({
        id: c.id,
        questionText: c.questionText,
        score: 0, // Don't expose actual scores (anonymous)
        respondedAt: c.completedAt.toISOString(),
      })),
    });
  }

  // Sort by week (most recent first)
  return history.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

/**
 * Helper: Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
