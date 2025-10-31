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
import { Scheduler } from './scheduler.js';
import { sendPulseInvitationsJob } from './jobs/sendPulseInvitations.js';

/**
 * Initialize and configure the scheduler with all jobs
 */
export function initializeScheduler(prisma: PrismaClient): Scheduler {
  const scheduler = new Scheduler(prisma);

  // Register Weekly Pulse invitation job
  // Runs every 15 minutes to check if invitations should be sent
  scheduler.register(
    'pulse-invitations',
    '*/15 * * * *', // Every 15 minutes
    async () => {
      await sendPulseInvitationsJob(prisma);
    }
  );

  // Add more scheduled jobs here as needed
  // Example:
  // scheduler.register('cleanup-old-data', '0 2 * * *', async () => {
  //   await cleanupOldDataJob(prisma);
  // });

  return scheduler;
}

export { Scheduler } from './scheduler.js';
