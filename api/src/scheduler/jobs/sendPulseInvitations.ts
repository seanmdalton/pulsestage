/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PrismaClient } from '@prisma/client';
import { sendPulseInvitations } from '../../pulse/invitationService.js';

/**
 * Scheduled job to send pulse invitations based on configured schedules
 */
export async function sendPulseInvitationsJob(prisma: PrismaClient) {
  console.log('📊 Checking for scheduled pulse invitations...');

  try {
    // Find all enabled schedules
    const schedules = await prisma.pulseSchedule.findMany({
      where: { enabled: true },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    if (schedules.length === 0) {
      console.log('ℹ️  No enabled pulse schedules found');
      return;
    }

    console.log(`Found ${schedules.length} enabled schedule(s)`);

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const schedule of schedules) {
      // Check if today matches the schedule's day of week
      const shouldRunToday = schedule.dayOfWeek === currentDayOfWeek;

      if (!shouldRunToday) {
        console.log(
          `⏭️  Skipping tenant ${schedule.tenant.slug}: scheduled for day ${schedule.dayOfWeek}, today is ${currentDayOfWeek}`
        );
        continue;
      }

      // Check if current time is close to scheduled time (within 15 minutes)
      const scheduledTime = schedule.timeOfDay;
      const timeDiff = getMinutesDifference(currentTime, scheduledTime);

      if (timeDiff > 15) {
        console.log(
          `⏭️  Skipping tenant ${schedule.tenant.slug}: scheduled for ${scheduledTime}, current time ${currentTime} (${timeDiff} min difference)`
        );
        continue;
      }

      console.log(`✅ Processing pulse for tenant: ${schedule.tenant.slug}`);

      // Determine which cohort to invite
      let cohortName: string;

      if (schedule.rotatingCohorts) {
        // Rotate through weekday cohorts (0-4)
        const cohortIndex = currentDayOfWeek === 0 ? 4 : currentDayOfWeek - 1; // Sunday maps to cohort 4
        cohortName = `weekday-${cohortIndex}`;
        console.log(`📅 Using rotating cohort: ${cohortName} (day ${currentDayOfWeek})`);
      } else {
        // Use default cohort (all users)
        cohortName = 'all';
        console.log('📅 Using cohort: all (no rotation)');
      }

      // Get active questions for this tenant
      const questions = await prisma.pulseQuestion.findMany({
        where: {
          tenantId: schedule.tenantId,
          active: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (questions.length === 0) {
        console.warn(`⚠️  No active questions for tenant ${schedule.tenant.slug}, skipping`);
        continue;
      }

      // Get cohort users
      const cohort = await prisma.pulseCohort.findUnique({
        where: {
          tenantId_name: {
            tenantId: schedule.tenantId,
            name: cohortName,
          },
        },
      });

      if (!cohort) {
        console.warn(`⚠️  Cohort '${cohortName}' not found for tenant ${schedule.tenant.slug}`);
        continue;
      }

      const userIds = JSON.parse(cohort.userIds as string) as string[];
      console.log(`📧 Sending invitations to ${userIds.length} user(s) in cohort '${cohortName}'`);

      // Filter users who don't already have an invite this week
      const weekStart = getWeekStart(now);
      const eligibleUsers: string[] = [];

      for (const userId of userIds) {
        const existingInvite = await prisma.pulseInvite.findFirst({
          where: {
            tenantId: schedule.tenantId,
            userId: userId,
            sentAt: {
              gte: weekStart,
            },
          },
        });

        if (!existingInvite) {
          eligibleUsers.push(userId);
        }
      }

      if (eligibleUsers.length === 0) {
        console.log(`ℹ️  All users in cohort '${cohortName}' already have invites this week`);
        continue;
      }

      // Select one question for this cohort (rotate through questions)
      // Use day of week to deterministically select a question
      const questionIndex = currentDayOfWeek % questions.length;
      const question = questions[questionIndex];

      console.log(
        `📧 Sending invitations to ${eligibleUsers.length} user(s) for question: ${question.text.substring(0, 50)}...`
      );

      // Send invitations
      try {
        const result = await sendPulseInvitations(prisma, {
          tenantId: schedule.tenantId,
          questionId: question.id,
          userIds: eligibleUsers,
          cohortName,
        });

        console.log(
          `📊 Completed pulse for tenant ${schedule.tenant.slug}: ${result.sent} sent, ${result.failed} errors`
        );
      } catch (error) {
        console.error(`❌ Error sending invitations for tenant ${schedule.tenant.slug}:`, error);
      }
    }

    console.log('✅ Pulse invitation job completed');
  } catch (error) {
    console.error('❌ Error in sendPulseInvitationsJob:', error);
    throw error;
  }
}

/**
 * Get the difference in minutes between two HH:mm time strings
 */
function getMinutesDifference(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);

  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;

  return Math.abs(minutes1 - minutes2);
}

/**
 * Get the start of the current week (Sunday at 00:00)
 */
function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day; // Adjust to Sunday
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Simple hash function to deterministically map user ID to question index
 */
function _hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
