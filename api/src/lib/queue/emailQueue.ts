/**
 * Email Queue
 *
 * Bull queue for sending emails in the background with retry logic
 */

import { Queue, Worker, Job } from 'bullmq';
import { getEmailService } from '../email/emailService.js';
import { renderQuestionAnsweredEmail } from '../email/templates.js';
import type { EmailOptions } from '../email/types.js';

/**
 * Email job data structure
 */
export interface EmailJob {
  type: 'question-answered';
  data: {
    to: string;
    toName: string;
    questionBody: string;
    answerBody: string;
    responderName: string;
    questionUrl: string;
    unsubscribeUrl: string;
  };
}

/**
 * Direct email job (for custom emails)
 */
export interface DirectEmailJob {
  type: 'direct';
  emailOptions: EmailOptions;
}

export type EmailQueueJob = EmailJob | DirectEmailJob;

// Redis connection for Bull
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

/**
 * Email queue instance
 */
export const emailQueue = new Queue<EmailQueueJob>('email', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

/**
 * Email queue worker
 */
let worker: Worker<EmailQueueJob> | null = null;

export function startEmailWorker() {
  if (worker) {
    console.log('📧 Email worker already started');
    return worker;
  }

  worker = new Worker<EmailQueueJob>(
    'email',
    async (job: Job<EmailQueueJob>) => {
      console.log(`📧 Processing email job ${job.id}:`, job.data.type);

      const emailService = getEmailService();

      try {
        if (job.data.type === 'question-answered') {
          // Render template
          const html = await renderQuestionAnsweredEmail({
            userName: job.data.data.toName,
            questionBody: job.data.data.questionBody,
            answerBody: job.data.data.answerBody,
            responderName: job.data.data.responderName,
            questionUrl: job.data.data.questionUrl,
            unsubscribeUrl: job.data.data.unsubscribeUrl,
          });

          // Send email
          const result = await emailService.send({
            to: {
              email: job.data.data.to,
              name: job.data.data.toName,
            },
            subject: 'Your question was answered!',
            html,
          });

          if (!result.success) {
            throw new Error(`Failed to send email: ${result.error}`);
          }

          console.log(`✅ Email sent successfully to ${job.data.data.to}:`, result.messageId);

          // TODO: Add audit logging with proper tenant ID from job data

          return result;
        } else if (job.data.type === 'direct') {
          // Send direct email
          const result = await emailService.send(job.data.emailOptions);

          if (!result.success) {
            throw new Error(`Failed to send email: ${result.error}`);
          }

          console.log(`✅ Direct email sent successfully:`, result.messageId);
          return result;
        }

        throw new Error(`Unknown email job type: ${(job.data as any).type}`);
      } catch (error) {
        console.error(`❌ Email job ${job.id} failed:`, error);

        // TODO: Add audit logging for failed emails with proper tenant ID

        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 emails concurrently
    }
  );

  worker.on('completed', job => {
    console.log(`✅ Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err);
  });

  console.log('📧 Email worker started');
  return worker;
}

/**
 * Stop the email worker
 */
export async function stopEmailWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('📧 Email worker stopped');
  }
}

/**
 * Queue a "question answered" email
 */
export async function queueQuestionAnsweredEmail(data: EmailJob['data']) {
  const job = await emailQueue.add('question-answered', {
    type: 'question-answered',
    data,
  });

  console.log(`📧 Queued question-answered email job ${job.id}`);
  return job;
}

/**
 * Queue a direct email
 */
export async function queueDirectEmail(emailOptions: EmailOptions) {
  const job = await emailQueue.add('direct-email', {
    type: 'direct',
    emailOptions,
  });

  console.log(`📧 Queued direct email job ${job.id}`);
  return job;
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Get recent jobs
 */
export async function getRecentJobs(count: number = 10) {
  const [completedJobs, failedJobs, activeJobs, waitingJobs] = await Promise.all([
    emailQueue.getCompleted(0, count - 1),
    emailQueue.getFailed(0, count - 1),
    emailQueue.getActive(0, count - 1),
    emailQueue.getWaiting(0, count - 1),
  ]);

  return {
    completed: completedJobs,
    failed: failedJobs,
    active: activeJobs,
    waiting: waitingJobs,
  };
}
