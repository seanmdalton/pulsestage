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

import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

type ScheduledJob = {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  cronJob?: cron.ScheduledTask;
};

/**
 * Scheduler service for managing background jobs
 */
export class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a new scheduled job
   */
  register(name: string, schedule: string, task: () => Promise<void>) {
    if (this.jobs.has(name)) {
      console.warn(`⚠️  Job '${name}' already registered, skipping`);
      return;
    }

    this.jobs.set(name, { name, schedule, task });
    console.log(`📅 Registered job: ${name} (${schedule})`);
  }

  /**
   * Start all registered jobs
   */
  start() {
    console.log('🚀 Starting scheduler...');

    for (const [name, job] of this.jobs.entries()) {
      if (!cron.validate(job.schedule)) {
        console.error(`❌ Invalid cron schedule for job '${name}': ${job.schedule}`);
        continue;
      }

      const cronJob = cron.schedule(
        job.schedule,
        async () => {
          console.log(`⏰ Running scheduled job: ${name}`);
          try {
            await job.task();
            console.log(`✅ Completed job: ${name}`);
          } catch (error) {
            console.error(`❌ Error in job '${name}':`, error);
          }
        },
        {
          timezone: process.env.TZ || 'UTC',
        }
      );

      job.cronJob = cronJob;
      cronJob.start();
      console.log(`✅ Started job: ${name}`);
    }

    console.log(`✅ Scheduler started with ${this.jobs.size} job(s)`);
  }

  /**
   * Stop all jobs
   */
  stop() {
    console.log('🛑 Stopping scheduler...');

    for (const [name, job] of this.jobs.entries()) {
      if (job.cronJob) {
        job.cronJob.stop();
        console.log(`✅ Stopped job: ${name}`);
      }
    }

    console.log('✅ Scheduler stopped');
  }

  /**
   * Manually trigger a job by name (for testing)
   */
  async trigger(name: string) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job '${name}' not found`);
    }

    console.log(`🔧 Manually triggering job: ${name}`);
    await job.task();
    console.log(`✅ Manual trigger completed: ${name}`);
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      schedule: job.schedule,
      running: job.cronJob ? true : false,
    }));
  }
}
