/**
 * Pulse Scheduler
 * Handles daily cron job for sending pulse invitations
 */

import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { triggerPulseForCohort } from './invitationService.js';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Determine which cohort should receive pulse today
 * Uses deterministic rotation: cohort_index = day_of_week % num_cohorts
 */
function getTodaysCohort(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.

  // Use Monday-Friday rotation (0-4)
  const cohortIndex = dayOfWeek === 0 ? 4 : dayOfWeek - 1; // Map Sunday to Friday

  return `weekday-${cohortIndex}`;
}

/**
 * Process pulse sends for all tenants
 */
async function processPulseSends(prisma: PrismaClient) {
  console.log('🔄 Starting scheduled pulse send process...');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        settings: true,
      },
    });

    for (const tenant of tenants) {
      try {
        // Check if pulse is enabled in settings
        const settings = tenant.settings?.settings as any;
        if (!settings?.pulse?.enabled) {
          console.log(`⏭️  Skipping tenant ${tenant.slug}: Pulse not enabled`);
          continue;
        }

        // Get schedule for this tenant
        const schedule = await prisma.pulseSchedule.findUnique({
          where: { tenantId: tenant.id, enabled: true },
        });

        if (!schedule) {
          console.log(`⏭️  Skipping tenant ${tenant.slug}: No schedule configured`);
          continue;
        }

        // Check if rotation is enabled
        if (!schedule.rotatingCohorts) {
          console.log(`⏭️  Skipping tenant ${tenant.slug}: Cohort rotation disabled`);
          continue;
        }

        // Get today's cohort
        const cohortName = getTodaysCohort();

        console.log(`📤 Sending pulse for tenant ${tenant.slug}, cohort ${cohortName}`);

        // Trigger pulse for this cohort
        const result = await triggerPulseForCohort(prisma, tenant.id, cohortName);

        console.log(
          `✅ Tenant ${tenant.slug}: Sent ${result.sent} invitations, ${result.failed} failed`
        );
      } catch (error) {
        console.error(`❌ Error processing tenant ${tenant.slug}:`, error);
      }
    }

    console.log('✅ Pulse send process completed');
  } catch (error) {
    console.error('❌ Error in pulse send process:', error);
  }
}

/**
 * Start the pulse scheduler
 * Runs daily at configured time (default: 9:00 AM)
 */
export function startPulseScheduler(prisma: PrismaClient) {
  if (scheduledTask) {
    console.log('⚠️  Pulse scheduler already running');
    return;
  }

  // Default to 9:00 AM every day
  // Cron format: minute hour day month weekday
  // "0 9 * * *" = Every day at 9:00 AM
  // "0 9 * * 1-5" = Every weekday at 9:00 AM
  const cronSchedule = process.env.PULSE_CRON_SCHEDULE || '0 9 * * 1-5';

  console.log(`📅 Starting Pulse scheduler (cron: ${cronSchedule})`);

  scheduledTask = cron.schedule(
    cronSchedule,
    async () => {
      console.log(`⏰ Pulse scheduler triggered at ${new Date().toISOString()}`);
      await processPulseSends(prisma);
    },
    {
      timezone: process.env.TZ || 'UTC',
    }
  );

  console.log('✅ Pulse scheduler started');
}

/**
 * Stop the pulse scheduler
 */
export function stopPulseScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('🛑 Pulse scheduler stopped');
  }
}

/**
 * Manually trigger pulse send (for testing)
 */
export async function manualTriggerPulseSend(
  prisma: PrismaClient,
  tenantId?: string,
  cohortName?: string
) {
  console.log('🎯 Manual pulse trigger initiated');

  if (tenantId && cohortName) {
    // Send to specific tenant + cohort
    console.log(`Sending to specific tenant ${tenantId}, cohort ${cohortName}`);
    return await triggerPulseForCohort(prisma, tenantId, cohortName);
  }

  if (tenantId) {
    // Send to specific tenant's today cohort
    const todaysCohort = getTodaysCohort();
    console.log(`Sending to tenant ${tenantId}, today's cohort: ${todaysCohort}`);
    return await triggerPulseForCohort(prisma, tenantId, todaysCohort);
  }

  // Send to all tenants
  await processPulseSends(prisma);
  return { sent: 0, failed: 0, errors: [] };
}
