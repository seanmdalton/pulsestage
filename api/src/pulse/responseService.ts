/**
 * Pulse Response Service
 * Handles one-tap response submission with token validation
 */

import { PrismaClient, PulseInviteStatus } from '@prisma/client';

export interface SubmitResponseRequest {
  token: string;
  score: number;
  comment?: string;
}

export interface SubmitResponseResult {
  success: boolean;
  message: string;
  error?: string;
  questionText?: string;
}

/**
 * Submit a Pulse response via one-tap link
 */
export async function submitPulseResponse(
  prisma: PrismaClient,
  request: SubmitResponseRequest
): Promise<SubmitResponseResult> {
  const { token, score, comment } = request;

  // 1. Find the invite by token
  const invite = await prisma.pulseInvite.findUnique({
    where: { token },
    include: {
      question: true,
      user: true,
    },
  });

  if (!invite) {
    return {
      success: false,
      message: 'Invalid response link',
      error: 'INVALID_TOKEN',
    };
  }

  // 2. Check if already completed
  if (invite.status === PulseInviteStatus.COMPLETED) {
    return {
      success: false,
      message: 'You have already responded to this question',
      error: 'ALREADY_COMPLETED',
      questionText: invite.question.text,
    };
  }

  // 3. Check if expired
  if (new Date() > invite.expiresAt) {
    await prisma.pulseInvite.update({
      where: { id: invite.id },
      data: { status: PulseInviteStatus.EXPIRED },
    });

    return {
      success: false,
      message: 'This response link has expired',
      error: 'EXPIRED',
      questionText: invite.question.text,
    };
  }

  // 4. Validate score range based on scale
  const { scale } = invite.question;
  const minScore = scale === 'LIKERT_1_5' ? 1 : 0;
  const maxScore = scale === 'LIKERT_1_5' ? 5 : 10;

  if (score < minScore || score > maxScore) {
    return {
      success: false,
      message: `Invalid score. Expected ${minScore}-${maxScore} for ${scale}`,
      error: 'INVALID_SCORE',
    };
  }

  // 5. Get cohort name from invite metadata (if available)
  // In our current implementation, we can derive it from the user's cohort
  let cohortName: string | null = null;
  if (invite.userId) {
    const cohorts = await prisma.pulseCohort.findMany({
      where: { tenantId: invite.tenantId },
    });

    for (const cohort of cohorts) {
      // Prisma automatically parses JSON fields, so userIds is already an array
      const userIds = cohort.userIds as unknown as string[];
      if (userIds.includes(invite.userId)) {
        cohortName = cohort.name;
        break;
      }
    }
  }

  // 6. Create the anonymous response (no userId!)
  await prisma.pulseResponse.create({
    data: {
      tenantId: invite.tenantId,
      teamId: invite.teamId, // Associate response with team from invite
      questionId: invite.questionId,
      score,
      comment: comment || null,
      cohortName,
      submittedAt: new Date(),
    },
  });

  // 7. Mark invite as completed
  await prisma.pulseInvite.update({
    where: { id: invite.id },
    data: {
      status: PulseInviteStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    message: 'Thank you for your response!',
    questionText: invite.question.text,
  };
}

/**
 * Get invite status (for displaying confirmation page)
 */
export async function getPulseInviteStatus(
  prisma: PrismaClient,
  token: string
): Promise<{
  valid: boolean;
  questionText?: string;
  scale?: string;
  status?: PulseInviteStatus;
  alreadyCompleted?: boolean;
  expired?: boolean;
}> {
  const invite = await prisma.pulseInvite.findUnique({
    where: { token },
    include: { question: true },
  });

  if (!invite) {
    return { valid: false };
  }

  const now = new Date();
  const expired = now > invite.expiresAt;
  const alreadyCompleted = invite.status === PulseInviteStatus.COMPLETED;

  return {
    valid: true,
    questionText: invite.question.text,
    scale: invite.question.scale,
    status: invite.status,
    alreadyCompleted,
    expired,
  };
}
