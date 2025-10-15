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

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './env.js';
import { requireAdminKey } from './middleware/adminAuth.js';
import { rateLimit } from './middleware/rateLimit.js';
import {
  RATE_LIMITS,
  HTTP_STATUS,
  DATABASE_LIMITS,
  TIME_CONSTANTS,
  AUDIT_CONSTANTS,
  VALIDATION_PATTERNS,
  SSE_CONSTANTS,
  MODERATION,
} from './constants.js';
import { createSessionMiddleware } from './middleware/session.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { requireAdminRole } from './middleware/requireAdminRole.js';
import {
  sessionAuthMiddleware,
  requireSessionAuth,
  getUserTeamsWithMembership,
  getUserPreferences,
  toggleTeamFavorite,
  setDefaultTeam, // eslint-disable-line @typescript-eslint/no-unused-vars
  setUserPreferences,
} from './middleware/sessionAuth.js';
import { AuthManager, getDemoModeConfig } from './lib/auth/index.js';
import { createTenantResolverMiddleware } from './middleware/tenantResolver.js';
import { applyTenantMiddleware } from './middleware/prismaMiddleware.js';
import { eventBus } from './lib/eventBus.js';
import { initAuditService, auditService } from './lib/auditService.js';
import {
  initPermissionMiddleware,
  requirePermission,
  requireRole, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './middleware/requirePermission.js';
import { requireAuth } from './middleware/requireAuth.js';
import {
  initTeamScopingMiddleware,
  extractQuestionTeam,
  getUserTeamsByRole, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './middleware/teamScoping.js';
import {
  securityHeadersMiddleware,
  apiSecurityHeaders,
  developmentSecurityHeaders,
} from './middleware/securityHeaders.js';
import { provideCsrfToken, validateCsrfToken, csrfTokenEndpoint } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Package doesn't have TypeScript types
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to format uptime in human-readable format
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function createApp(prisma: PrismaClient) {
  const app = express();

  // Apply Prisma middleware for automatic tenant scoping
  applyTenantMiddleware(prisma);

  // Initialize audit service
  initAuditService(prisma);

  // Initialize permission middleware
  initPermissionMiddleware(prisma);

  // Initialize team scoping middleware
  initTeamScopingMiddleware(prisma);

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // In development, allow any origin for convenience
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        // In production, require explicit allowlist via CORS_ORIGINS
        const allowed = env.CORS_ORIGINS || [];
        if (!origin) {
          // Non-browser or same-origin requests
          return callback(null, true);
        }
        if (allowed.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
      },
      credentials: true,
    })
  );

  // Trust proxy in production for correct secure cookies
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security headers (Helmet)
  // Use relaxed CSP in development for Vite HMR, strict in production
  if (process.env.NODE_ENV === 'production') {
    app.use(securityHeadersMiddleware());
  } else {
    app.use(developmentSecurityHeaders());
  }

  // Additional API security headers (both environments)
  app.use(apiSecurityHeaders());

  // Cookie parser (required for CSRF)
  app.use(cookieParser());

  app.use(express.json());

  // Session middleware
  app.use(createSessionMiddleware());

  // Tenant resolution middleware - resolves tenant from header/subdomain/default
  // MUST come before sessionAuthMiddleware to validate user's tenant
  app.use(createTenantResolverMiddleware(prisma));

  // Session authentication middleware
  // Reads req.session.user (set by demo auth or OAuth) and populates req.user
  // Also supports x-mock-sso-user header for testing (dev/test only)
  // Required for all session-based authentication
  app.use(sessionAuthMiddleware);

  // Swagger UI - only in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const openapiPath = join(__dirname, '..', 'openapi.yaml');
      const openapiContent = readFileSync(openapiPath, 'utf8');
      const openapiSpec = parseYaml(openapiContent);

      app.use(
        '/docs',
        swaggerUi.serve,
        swaggerUi.setup(openapiSpec, {
          customSiteTitle: 'PulseStage API Documentation',
          customCss: '.swagger-ui .topbar { display: none }',
        })
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('📚 API documentation available at /docs');
      }
    } catch (error) {
      console.warn('⚠️  Failed to load OpenAPI spec:', error);
    }
  }

  // Root endpoint for service info and security scans
  app.get('/', (_req, res) => {
    res.json({
      service: 'PulseStage API',
      version: '1.0.0',
      status: 'healthy',
    });
  });

  // CSRF token endpoint for clients
  app.get('/csrf-token', csrfTokenEndpoint());

  // Basic health check - simple liveness probe
  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'ama-api', timestamp: new Date().toISOString() });
  });

  // Liveness probe - checks if application is running
  // Returns 200 if app is alive (even if dependencies are down)
  app.get('/health/live', (_req, res) => {
    res.json({
      status: 'alive',
      service: 'ama-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe - checks if application is ready to serve traffic
  // Returns 200 only if all critical dependencies are healthy
  app.get('/health/ready', async (_req, res) => {
    const checks = {
      database: false,
      redis: false,
    };

    let isReady = true;

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Readiness check: Database unhealthy', error);
      isReady = false;
    }

    // Check Redis (if required in production)
    if (process.env.NODE_ENV === 'production') {
      const { getRedisStatus } = await import('./middleware/rateLimit.js');
      const { getSessionRedisStatus } = await import('./middleware/session.js');
      const rateLimitRedis = getRedisStatus();
      const sessionRedis = getSessionRedisStatus();

      // Redis is required in production - check both connected and ready
      if (!rateLimitRedis.ready || !sessionRedis.ready) {
        isReady = false;
        checks.redis = false;
      } else {
        checks.redis = true;
      }
    } else {
      // Redis not required in development
      checks.redis = true;
    }

    const status = isReady ? 200 : 503;
    res.status(status).json({
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  // Health dashboard - detailed system metrics (admin only)
  app.get('/admin/health', requirePermission('admin.access'), async (_req, res) => {
    try {
      // Get SSE metrics
      const sseMetrics = eventBus.getMetrics();

      // Get database metrics (Prisma connection pool)
      // Note: Prisma doesn't expose detailed pool metrics, but we can check connectivity
      let dbStatus = 'connected';
      let dbConnectionTime: number | null = null;
      try {
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1 as health_check`;
        dbConnectionTime = Date.now() - startTime;
      } catch (_error) {
        dbStatus = 'disconnected';
      }

      // Get Redis status (from rate limiting and session store)
      const { getRedisStatus } = await import('./middleware/rateLimit.js');
      const { getSessionRedisStatus } = await import('./middleware/session.js');
      const rateLimitRedis = getRedisStatus();
      const sessionRedis = getSessionRedisStatus();

      // Debug logging for Redis status
      console.log('Health check - Rate limit Redis:', rateLimitRedis);
      console.log('Health check - Session Redis:', sessionRedis);

      // Get uptime
      const uptimeSeconds = process.uptime();
      const uptimeFormatted = formatUptime(uptimeSeconds);

      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const memoryMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      };

      // Get tenant count
      const tenantCount = await prisma.tenant.count();

      // Get question count (global)
      const questionCount = await prisma.question.count();

      // Get user count (global)
      const userCount = await prisma.user.count();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.round(uptimeSeconds),
          formatted: uptimeFormatted,
        },
        database: {
          status: dbStatus,
          responseTimeMs: dbConnectionTime,
          provider: 'PostgreSQL',
        },
        redis: {
          rateLimit: {
            connected: rateLimitRedis.connected,
            ready: rateLimitRedis.ready,
            enabled: process.env.NODE_ENV !== 'development',
          },
          sessions: {
            connected: sessionRedis.connected,
            ready: sessionRedis.ready,
          },
        },
        sse: {
          totalConnections: sseMetrics.totalConnections,
          tenantCount: sseMetrics.tenantCount,
          tenantConnections: sseMetrics.tenantConnections,
        },
        memory: {
          rss: `${memoryMB.rss} MB`,
          heapTotal: `${memoryMB.heapTotal} MB`,
          heapUsed: `${memoryMB.heapUsed} MB`,
          external: `${memoryMB.external} MB`,
        },
        data: {
          tenants: tenantCount,
          questions: questionCount,
          users: userCount,
        },
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'unhealthy',
        error: 'Failed to gather health metrics',
      });
    }
  });

  // Email queue status - admin only
  app.get('/admin/email-queue', requirePermission('admin.access'), async (_req, res) => {
    try {
      const { getQueueMetrics, getRecentJobs } = await import('./lib/queue/emailQueue.js');

      const metrics = await getQueueMetrics();
      const recentJobs = await getRecentJobs(20);

      res.json({
        metrics,
        recentJobs: {
          active: recentJobs.active.map((job: any) => ({
            id: job.id,
            name: job.name,
            data: job.data,
            attemptsMade: job.attemptsMade,
            processedOn: job.processedOn,
          })),
          waiting: recentJobs.waiting.map((job: any) => ({
            id: job.id,
            name: job.name,
            data: job.data,
            timestamp: job.timestamp,
          })),
          completed: recentJobs.completed.map((job: any) => ({
            id: job.id,
            name: job.name,
            finishedOn: job.finishedOn,
            returnvalue: job.returnvalue,
          })),
          failed: recentJobs.failed.map((job: any) => ({
            id: job.id,
            name: job.name,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
            finishedOn: job.finishedOn,
          })),
        },
      });
    } catch (error) {
      console.error('Email queue status error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to get email queue status',
      });
    }
  });

  // ============================================================================
  // DEMO RESET ENDPOINT
  // ============================================================================

  /**
   * POST /admin/reset-demo
   * Resets demo instance to clean state with fresh sample data
   * Requires: x-admin-key header
   * Only works when AUTH_MODE_DEMO=true
   */
  app.post('/admin/reset-demo', async (req, res) => {
    try {
      // 1. Check if demo mode is enabled
      if (!authManager.isModeEnabled('demo')) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Demo mode is not enabled',
          message: 'This endpoint only works when AUTH_MODE_DEMO=true',
        });
      }

      // 2. Verify admin key
      const adminKey = req.headers['x-admin-key'] as string;
      if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        await auditService.log(req, {
          action: 'demo.reset.unauthorized',
          entityType: 'demo',
          metadata: {
            error: 'Invalid or missing admin key',
          },
        });

        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Unauthorized',
          message: 'Invalid or missing admin key',
        });
      }

      // 3. Get tenant ID
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      console.log('🔄 Starting demo reset for tenant:', tenantId);

      // 4. Delete user-generated data (in transaction)
      const deleteCounts = await prisma.$transaction(async tx => {
        // Count items before deletion
        const questionCount = await tx.question.count({ where: { tenantId } });
        const upvoteCount = await tx.upvote.count({
          where: {
            question: { tenantId },
          },
        });
        const auditLogCount = await tx.auditLog.count({ where: { tenantId } });

        // Delete question tags (foreign key constraint)
        await tx.questionTag.deleteMany({
          where: {
            question: { tenantId },
          },
        });

        // Delete upvotes
        await tx.upvote.deleteMany({
          where: {
            question: { tenantId },
          },
        });

        // Delete questions
        await tx.question.deleteMany({
          where: { tenantId },
        });

        // Delete audit logs (optional - keeps history clean)
        await tx.auditLog.deleteMany({
          where: { tenantId },
        });

        console.log('✅ Cleared existing data:', {
          questions: questionCount,
          upvotes: upvoteCount,
          auditLogs: auditLogCount,
        });

        return {
          questions: questionCount,
          upvotes: upvoteCount,
          auditLogs: auditLogCount,
        };
      });

      // 5. Re-seed demo data
      const { seedDemoData } = await import('./seed-demo-data.js');
      await seedDemoData(prisma, tenantId);

      console.log('✅ Re-seeded demo data');

      // 6. Log successful reset
      await auditService.log(req, {
        action: 'demo.reset.success',
        entityType: 'demo',
        metadata: {
          deletedCounts: deleteCounts,
        },
      });

      // 7. Return success
      res.json({
        success: true,
        message: 'Demo instance reset successfully',
        timestamp: new Date().toISOString(),
        resetItems: {
          questionsCleared: deleteCounts.questions,
          upvotesCleared: deleteCounts.upvotes,
          auditLogsCleared: deleteCounts.auditLogs,
          demoDataReseeded: true,
        },
      });

      console.log('🎉 Demo reset complete');
    } catch (error) {
      console.error('❌ Demo reset failed:', error);

      // Log failed reset attempt
      if (req.tenant?.tenantId) {
        await auditService.log(req, {
          action: 'demo.reset.failed',
          entityType: 'demo',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to reset demo instance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================================================
  // MODERATION REVIEW ENDPOINTS (Phase 3)
  // ============================================================================

  // Get all questions under review
  app.get(
    '/admin/moderation/review-queue',
    requirePermission('question.answer'),
    async (req, res) => {
      try {
        const { teamId, confidence } = req.query;

        const where: any = {
          status: 'UNDER_REVIEW',
        };

        // Filter by team if specified
        if (teamId && typeof teamId === 'string') {
          where.teamId = teamId;
        }

        // Filter by confidence level if specified
        if (confidence && typeof confidence === 'string') {
          where.moderationConfidence = confidence;
        }

        const questions = await prisma.question.findMany({
          where,
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc', // Oldest first (FIFO)
          },
        });

        res.json(questions);
      } catch (error) {
        console.error('Failed to fetch review queue:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to fetch review queue',
        });
      }
    }
  );

  // Approve a question under review
  app.post(
    '/admin/moderation/approve/:id',
    requirePermission('question.answer'),
    async (req, res) => {
      try {
        const { id } = req.params;

        // Find the question
        const question = await prisma.question.findUnique({
          where: { id },
        });

        if (!question) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question not found' });
        }

        if (question.status !== 'UNDER_REVIEW') {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Question is not under review',
          });
        }

        // Approve: change status to OPEN
        const updatedQuestion = await prisma.question.update({
          where: { id },
          data: {
            status: 'OPEN',
            reviewedBy: req.user?.id || null,
            reviewedAt: new Date(),
          },
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Audit log the approval
        await auditService.log(req, {
          action: 'question.moderation.approved',
          entityType: 'question',
          entityId: id,
          metadata: {
            questionId: id,
            teamId: question.teamId,
            originalReasons: question.moderationReasons,
            confidence: question.moderationConfidence,
          },
        });

        // Publish SSE event for question creation (now that it's approved)
        eventBus.publish({
          type: 'question:created',
          tenantId: req.tenant!.tenantId,
          data: updatedQuestion,
          timestamp: Date.now(),
        });

        // Send email notification to question author
        if (updatedQuestion.author?.email) {
          try {
            const { emailQueue } = await import('./lib/queue/emailQueue.js');
            const { renderQuestionApprovedEmail } = await import('./lib/email/templates.js');

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const questionUrl = `${frontendUrl}/questions/${updatedQuestion.id}`;
            const unsubscribeUrl = `${frontendUrl}/profile`;

            const html = await renderQuestionApprovedEmail({
              userName: updatedQuestion.author.name || 'User',
              questionBody: updatedQuestion.body,
              questionUrl,
              unsubscribeUrl,
            });

            await emailQueue.add('send-email', {
              type: 'direct',
              emailOptions: {
                to: {
                  email: updatedQuestion.author.email,
                  name: updatedQuestion.author.name || 'User',
                },
                subject: '✓ Your question has been approved',
                html,
              },
            });
          } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            // Don't fail the request if email fails
          }
        }

        res.json({
          ...updatedQuestion,
          message: 'Question approved and published',
        });
      } catch (error) {
        console.error('Failed to approve question:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to approve question',
        });
      }
    }
  );

  // Reject a question under review
  app.post(
    '/admin/moderation/reject/:id',
    requirePermission('question.answer'),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        // Find the question
        const question = await prisma.question.findUnique({
          where: { id },
          include: { author: true },
        });

        if (!question) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question not found' });
        }

        if (question.status !== 'UNDER_REVIEW') {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Question is not under review',
          });
        }

        // Audit log the rejection before deleting
        await auditService.log(req, {
          action: 'question.moderation.rejected',
          entityType: 'question',
          entityId: id,
          metadata: {
            questionId: id,
            questionBody: question.body.substring(0, 200),
            teamId: question.teamId,
            authorId: question.authorId,
            originalReasons: question.moderationReasons,
            confidence: question.moderationConfidence,
            rejectionReason: reason || 'No reason provided',
          },
        });

        // Send email notification to question author
        if (question.author?.email) {
          try {
            const { emailQueue } = await import('./lib/queue/emailQueue.js');
            const { renderQuestionRejectedEmail } = await import('./lib/email/templates.js');

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const guidelinesUrl = `${frontendUrl}/guidelines`;
            const unsubscribeUrl = `${frontendUrl}/profile`;

            const html = await renderQuestionRejectedEmail({
              userName: question.author.name || 'User',
              questionBody: question.body,
              rejectionReason: reason || 'Content did not meet community guidelines',
              guidelinesUrl,
              unsubscribeUrl,
            });

            await emailQueue.add('send-email', {
              type: 'direct',
              emailOptions: {
                to: { email: question.author.email, name: question.author.name || 'User' },
                subject: 'Your question was not approved',
                html,
              },
            });
          } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
            // Don't fail the request if email fails
          }
        }

        // Delete the question (rejected content is not kept)
        await prisma.question.delete({
          where: { id },
        });

        res.json({
          message: 'Question rejected and removed',
          questionId: id,
        });
      } catch (error) {
        console.error('Failed to reject question:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to reject question',
        });
      }
    }
  );

  // CSRF token endpoint - frontend can call this to get a token
  app.get('/csrf-token', provideCsrfToken(), csrfTokenEndpoint());

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================
  // Multi-mode authentication: demo, GitHub OAuth, Google OAuth

  const authManager = new AuthManager(prisma);

  // Get available authentication modes
  app.get('/auth/modes', (req, res) => {
    const modes = authManager.getEnabledModes();
    const demoConfig = authManager.isModeEnabled('demo') ? getDemoModeConfig() : null;

    res.json({
      modes,
      demo:
        demoConfig && demoConfig.enabled
          ? {
              enabled: true,
              users: demoConfig.users,
            }
          : { enabled: false },
      oauth: {
        github: authManager.isModeEnabled('oauth') && !!process.env.GITHUB_CLIENT_ID,
        google: authManager.isModeEnabled('oauth') && !!process.env.GOOGLE_CLIENT_ID,
      },
    });
  });

  // Demo mode authentication
  app.get('/auth/demo', async (req, res) => {
    try {
      if (!authManager.isModeEnabled('demo')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Demo mode is not enabled',
        });
      }

      const user = await authManager.authenticateDemo(req, res);

      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid demo user',
          message: 'Please provide a valid username (?user=alice)',
        });
      }

      // Store user in session
      req.session.user = user;
      req.session.tenantSlug = (req.query.tenant as string) || 'demo';

      // Save session before redirect (important!)
      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to create session',
          });
        }

        // Redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}?demo=true`);
      });
    } catch (error) {
      console.error('Demo auth error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GitHub OAuth - initiate
  app.get('/auth/github', async (req, res) => {
    try {
      if (!authManager.isModeEnabled('oauth')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'OAuth is not enabled',
        });
      }

      await authManager.initiateGitHub(req, res);
    } catch (error) {
      console.error('GitHub OAuth initiation error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to initiate GitHub authentication',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GitHub OAuth - callback
  app.get('/auth/github/callback', async (req, res) => {
    try {
      if (!authManager.isModeEnabled('oauth')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'OAuth is not enabled',
        });
      }

      const user = await authManager.handleGitHubCallback(req, res);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Authentication failed',
        });
      }

      // Store user in session
      req.session.user = user;

      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(frontendUrl);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  });

  // Google OAuth - initiate
  app.get('/auth/google', async (req, res) => {
    try {
      if (!authManager.isModeEnabled('oauth')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'OAuth is not enabled',
        });
      }

      await authManager.initiateGoogle(req, res);
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to initiate Google authentication',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Google OAuth - callback
  app.get('/auth/google/callback', async (req, res) => {
    try {
      if (!authManager.isModeEnabled('oauth')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'OAuth is not enabled',
        });
      }

      const user = await authManager.handleGoogleCallback(req, res);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Authentication failed',
        });
      }

      // Store user in session
      req.session.user = user;

      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(frontendUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  });

  // Logout
  app.post('/auth/logout', async (req, res) => {
    try {
      await authManager.logout(req, res);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================================================
  // MOCK SSO ENDPOINTS (Development Only)
  // ============================================================================
  // These endpoints support the mock SSO testing page
  // Only available when MOCK_SSO=true

  if (process.env.MOCK_SSO === 'true') {
    // Get all tenants for mock SSO tenant selection
    app.get('/mock-sso/tenants', async (req, res) => {
      try {
        const tenants = await prisma.tenant.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        res.json({ tenants });
      } catch (error) {
        console.error('Error fetching tenants for mock SSO:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to fetch tenants',
        });
      }
    });

    // Get all users for a specific tenant for mock SSO user selection
    app.get('/mock-sso/users/:tenantSlug', async (req, res) => {
      try {
        const { tenantSlug } = req.params;

        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
        });

        if (!tenant) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'Tenant not found',
          });
        }

        // Run the query in the correct tenant context
        // This is necessary because Prisma middleware automatically scopes queries by tenant
        const { runInTenantContext } = await import('./middleware/tenantContext.js');

        const { formattedUsers } = await runInTenantContext(
          { tenantId: tenant.id, tenantSlug: tenant.slug },
          async () => {
            const users = await prisma.user.findMany({
              where: {}, // Let middleware inject tenantId
              include: {
                teamMemberships: {
                  include: {
                    team: {
                      select: {
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            });

            // Format users for mock SSO display
            const formattedUsers = users.map(user => {
              // Get the highest role across all teams
              const roles = user.teamMemberships.map(m => m.role);
              const roleHierarchy = ['viewer', 'member', 'moderator', 'admin', 'owner'];
              const highestRole =
                roles.sort((a, b) => roleHierarchy.indexOf(b) - roleHierarchy.indexOf(a))[0] ||
                'member';

              // Format teams string
              const teamsString = user.teamMemberships
                .map(m => `${m.team.name} (${m.role})`)
                .join(', ');

              return {
                email: user.email,
                name: user.name,
                role: highestRole,
                teams: teamsString || 'No teams',
              };
            });

            return { formattedUsers };
          }
        );

        res.json({
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
          users: formattedUsers,
        });
      } catch (error) {
        console.error('Error fetching users for mock SSO:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to fetch users',
        });
      }
    });
  }

  // ============================================================================
  // SETUP WIZARD ENDPOINTS
  // ============================================================================
  // These endpoints support the first-time setup experience
  // No authentication required since setup happens before users exist

  // Check if setup wizard is needed
  app.get('/setup/status', async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
          needsSetup: true,
        });
      }

      // In development mode, skip setup wizard (demo users are auto-seeded)
      if (process.env.NODE_ENV === 'development') {
        const userCount = await prisma.user.count({
          where: { tenantId },
        });

        return res.json({
          needsSetup: false,
          teamCount: 0, // Teams can be created via UI
          userCount,
          tenantId,
          tenantSlug: req.tenant?.tenantSlug,
          mode: 'development',
        });
      }

      // Production mode: check if teams exist
      const teamCount = await prisma.team.count({
        where: { tenantId },
      });

      const userCount = await prisma.user.count({
        where: { tenantId },
      });

      // Setup is needed if either teams OR users are missing
      // Both are required for a functional system
      const needsSetup = teamCount === 0 || userCount === 0;

      if (needsSetup) {
        console.warn(
          `⚠️  Setup needed for tenant ${tenantId}: teams=${teamCount}, users=${userCount}`
        );
      }

      res.json({
        needsSetup,
        teamCount,
        userCount,
        tenantId,
        tenantSlug: req.tenant?.tenantSlug,
        mode: 'production',
      });
    } catch (error) {
      console.error('Error checking setup status:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to check setup status',
        needsSetup: true, // Fail open to allow setup attempts
      });
    }
  });

  // Create first team during setup
  const setupTeamSchema = z.object({
    name: z.string().min(1).max(DATABASE_LIMITS.MAX_TEAM_NAME),
    slug: z.string().min(1).max(DATABASE_LIMITS.MAX_TEAM_SLUG).regex(VALIDATION_PATTERNS.TEAM_SLUG),
    description: z.string().max(DATABASE_LIMITS.MAX_TEAM_DESCRIPTION).optional(),
    loadDemoData: z.boolean().optional(),
  });

  app.post('/setup/team', async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      // Verify setup is actually needed (prevent duplicate setup)
      const existingTeamCount = await prisma.team.count({
        where: { tenantId },
      });

      if (existingTeamCount > 0) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Setup already completed',
          message: 'Teams already exist in this tenant',
        });
      }

      const parse = setupTeamSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid request',
          details: parse.error.flatten(),
        });
      }

      const { name, slug, description, loadDemoData } = parse.data;

      // Create the team
      const team = await prisma.team.create({
        data: {
          name,
          slug,
          description: description || '',
          tenantId,
          isActive: true,
        },
      });

      console.log(`✅ Setup: Created first team "${name}" (${slug})`);

      res.json({
        success: true,
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          isActive: team.isActive,
          tenantId: team.tenantId,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
        },
        message: loadDemoData
          ? 'Team created. Demo data will be loaded next.'
          : 'Team created successfully. Ready to use!',
      });
    } catch (error: any) {
      console.error('Error during team setup:', error);

      // Handle unique constraint violations
      if (error.code === 'P2002') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Team slug already exists',
          message: 'Please choose a different slug',
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create team',
        message: error.message,
      });
    }
  });

  // Update tenant/organization name during setup
  const setupTenantSchema = z.object({
    name: z.string().min(1).max(100),
  });

  app.patch('/setup/tenant', async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const parse = setupTenantSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid request',
          details: parse.error.flatten(),
        });
      }

      const { name } = parse.data;

      // Update tenant name
      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { name },
      });

      console.log(`✅ Setup: Updated organization name to "${name}"`);

      res.json({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        message: 'Organization name updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update organization name',
        message: error.message,
      });
    }
  });

  // Create admin user during setup
  const setupAdminSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(255),
    teamId: z.string().uuid(),
  });

  app.post('/setup/admin-user', async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const parse = setupAdminSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid request',
          details: parse.error.flatten(),
        });
      }

      const { name, email, teamId } = parse.data;

      // Verify team exists and belongs to this tenant
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team || team.tenantId !== tenantId) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Team not found',
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          tenantId,
        },
      });

      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: 'User already exists',
          message: 'A user with this email already exists in this tenant',
        });
      }

      // Create the admin user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          tenantId,
          ssoId: email, // Use email as SSO ID for mock SSO
        },
      });

      // Create team membership with owner role
      await prisma.teamMembership.create({
        data: {
          userId: user.id,
          teamId,
          role: 'owner',
        },
      });

      console.log(`✅ Setup: Created admin user "${name}" (${email}) as owner of team`);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: 'Admin user created successfully. API will restart to load users...',
      });

      // Self-restart to reload mock SSO users
      // Docker's restart policy will automatically restart the container
      console.log('🔄 Restarting API to reload mock SSO users...');
      setTimeout(() => {
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      }, 2000); // Give response time to reach the client
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create admin user',
        message: error.message,
      });
    }
  });

  // Load demo data during setup
  app.post('/setup/demo-data', async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      // Note: No need to check for existing teams - demo data creates its own teams

      // Import and execute seed scripts
      // Note: These are the same scripts used for `npm run db:seed:full`
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      console.log('🌱 Loading demo data...');

      try {
        // Run the seed scripts
        await execAsync('node dist/seed-multi-tenant-data.js', {
          cwd: join(__dirname, '..'),
          env: { ...process.env, TENANT_ID: tenantId },
        });

        await execAsync('node dist/seed-tags.js', {
          cwd: join(__dirname, '..'),
          env: { ...process.env, TENANT_ID: tenantId },
        });

        console.log('✅ Demo data loaded successfully');

        res.json({
          success: true,
          message: 'Demo data loaded successfully. API will restart automatically in 2 seconds...',
          restartRequired: true,
        });

        // Self-restart to reload mock SSO users
        // Docker's restart policy will automatically restart the container
        console.log('🔄 Restarting API to reload mock SSO users...');
        setTimeout(() => {
          // eslint-disable-next-line no-process-exit
          process.exit(0);
        }, 2000); // Give response time to reach the client
      } catch (seedError: any) {
        console.error('Seed script error:', seedError);
        throw new Error(`Seed scripts failed: ${seedError.message}`);
      }
    } catch (error: any) {
      console.error('Error loading demo data:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to load demo data',
        message: error.message,
      });
    }
  });

  // SSE endpoint for real-time updates
  // Note: EventSource doesn't support custom headers, so we also check query param
  // Server-Sent Events endpoint - requires authentication
  app.get('/events', requireAuth, async (req, res) => {
    // SSE connections can't send custom headers, so prioritize query parameter
    let tenantId: string | undefined;
    let tenantSlug: string | undefined;

    // 1. Try query parameter first (for SSE connections)
    if (req.query.tenant) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: req.query.tenant as string },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      tenantId = tenant.id;
      tenantSlug = tenant.slug;
    }
    // 2. Fall back to middleware-resolved tenant
    else if (req.tenant) {
      tenantId = req.tenant.tenantId;
      tenantSlug = req.tenant.tenantSlug;
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant required for SSE connection' });
    }

    // Set SSE headers
    res.writeHead(HTTP_STATUS.OK, {
      'Content-Type': SSE_CONSTANTS.CONTENT_TYPE,
      'Cache-Control': SSE_CONSTANTS.CACHE_CONTROL,
      Connection: SSE_CONSTANTS.CONNECTION,
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    // Safe: SSE endpoint writing JSON-stringified data to text/event-stream
    // nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        tenantId,
        tenantSlug,
        timestamp: Date.now(),
      })}\n\n`
    );

    // Register client with event bus
    const clientId = eventBus.addClient(tenantId, res);

    // Handle client disconnect
    req.on('close', () => {
      eventBus.removeClient(tenantId, clientId);
    });
  });

  // Rate limited: 10 requests per minute per IP
  app.post(
    '/questions',
    rateLimit('create-question', RATE_LIMITS.CREATE_QUESTION),
    requirePermission('question.submit'),
    async (req, res) => {
      // Fetch tenant settings for dynamic validation
      const { getTenantSettings } = await import('./lib/settingsService.js');
      const settings = await getTenantSettings(prisma, req.tenant!.tenantId);

      // Create schema with tenant-specific limits
      const createQuestionSchema = z.object({
        body: z
          .string()
          .min(settings.questions.minLength, {
            message: `Question must be at least ${settings.questions.minLength} characters`,
          })
          .max(settings.questions.maxLength, {
            message: `Question must not exceed ${settings.questions.maxLength} characters`,
          }),
        teamId: z.string().optional(),
      });

      const parse = createQuestionSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });

      // Validate teamId if provided
      if (parse.data.teamId) {
        const team = await prisma.team.findUnique({ where: { id: parse.data.teamId } });
        if (!team || !team.isActive) {
          return res.status(400).json({ error: 'Invalid or inactive team' });
        }
      }

      // Moderate content before creating question
      const { moderateContent } = await import('./lib/moderation/index.js');
      const moderation = await moderateContent(parse.data.body);

      // Phase 1: Always audit log when content is flagged
      if (moderation.flagged) {
        const moderationId = `mod_${Date.now()}`;

        await auditService.log(req, {
          action: 'question.moderation.flagged',
          entityType: 'question',
          entityId: undefined, // Not created yet
          metadata: {
            questionPreview: parse.data.body.substring(0, 200),
            teamId: parse.data.teamId,
            reasons: moderation.reasons,
            confidence: moderation.confidence,
            providers: moderation.providers,
            moderationId,
          },
        });

        // Phase 2: Tiered moderation based on confidence
        if (moderation.confidence === 'high') {
          // High confidence = auto-reject (clear violations)
          console.warn('Question auto-rejected (high confidence):', {
            userId: req.user?.id,
            providers: moderation.providers,
            reasons: moderation.reasons,
            moderationId,
          });

          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Content does not meet community guidelines',
            reasons: moderation.reasons,
            moderationId,
          });
        }

        // Medium/low confidence = send to review queue
        console.log('Question sent to review queue:', {
          userId: req.user?.id,
          confidence: moderation.confidence,
          reasons: moderation.reasons,
          moderationId,
        });

        const questionData = {
          body: parse.data.body,
          status: 'UNDER_REVIEW' as const,
          teamId: parse.data.teamId || null,
          authorId: req.user?.id || null,
          upvotes: req.user?.id ? 1 : 0,
          tenantId: req.tenant!.tenantId,
          moderationReasons: moderation.reasons,
          moderationConfidence: moderation.confidence,
          moderationProviders: moderation.providers,
        };

        const q = await prisma.question.create({
          data: questionData,
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Create upvote record if authenticated
        if (req.user?.id) {
          await prisma.upvote.create({
            data: {
              questionId: q.id,
              userId: req.user.id,
            },
          });
        }

        // Audit log the review queue submission
        await auditService.log(req, {
          action: 'question.moderation.under_review',
          entityType: 'question',
          entityId: q.id,
          metadata: {
            questionId: q.id,
            teamId: q.teamId,
            reasons: moderation.reasons,
            confidence: moderation.confidence,
            moderationId,
          },
        });

        return res.status(HTTP_STATUS.CREATED).json({
          ...q,
          message: 'Your question is under review and will be published after moderator approval.',
        });
      }

      // Content is clean - proceed normally
      const questionData = {
        body: parse.data.body,
        teamId: parse.data.teamId || null,
        authorId: req.user?.id || null, // Set author if user is authenticated
        upvotes: req.user?.id ? 1 : 0, // Start with 1 upvote if user is authenticated
        tenantId: req.tenant!.tenantId, // Add tenant context
      };

      const q = await prisma.question.create({
        data: questionData,
        include: {
          team: true,
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // If user is authenticated, create an automatic upvote record
      if (req.user?.id) {
        await prisma.upvote.create({
          data: {
            questionId: q.id,
            userId: req.user.id,
          },
        });
      }

      // Publish SSE event for question creation
      eventBus.publish({
        type: 'question:created',
        tenantId: req.tenant!.tenantId,
        data: q,
        timestamp: Date.now(),
      });

      res.status(201).json(q);
    }
  );

  // Get all questions - requires authentication
  app.get('/questions', requireAuth, async (req, res) => {
    const status = (req.query.status as string)?.toUpperCase();
    const teamId = req.query.teamId as string;
    const search = req.query.search as string;
    const tagId = req.query.tagId as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const where: any =
      status === 'ANSWERED' ? { status: 'ANSWERED' as const } : { status: 'OPEN' as const };

    // Add team filter if provided
    if (teamId) {
      where.teamId = teamId;
    }

    // Add full-text search filter with prefix matching
    if (search && search.trim()) {
      // Use both full-text search (stemmed words) and prefix matching (substrings)
      // Split search into words and add :* for prefix matching
      const searchTerms = search
        .trim()
        .split(/\s+/)
        .map(term => `${term}:*`)
        .join(' & ');

      where.id = {
        in: await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "Question"
          WHERE search_vector @@ to_tsquery('english', ${searchTerms})
          ORDER BY ts_rank(search_vector, to_tsquery('english', ${searchTerms})) DESC
        `.then(results => results.map(r => r.id)),
      };
    }

    // Add tag filter
    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    // Add date range filters
    // Parse dates as local dates (YYYY-MM-DD) and convert to UTC boundaries
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        // Parse as YYYY-MM-DD and set to start of day (00:00:00 UTC)
        const fromDate = new Date(dateFrom + 'T00:00:00.000Z');
        where.createdAt.gte = fromDate;
      }
      if (dateTo) {
        // Parse as YYYY-MM-DD and set to end of day (23:59:59.999 UTC)
        const toDate = new Date(dateTo + 'T23:59:59.999Z');
        where.createdAt.lte = toDate;
      }
    }

    // Team scoping for moderators: only show questions from teams they moderate
    // Admins and owners can see all questions
    if (req.user) {
      try {
        const memberships = await prisma.teamMembership.findMany({
          where: { userId: req.user.id },
          select: { role: true, teamId: true },
        });

        const hasAdminRole = memberships.some(m => m.role === 'admin' || m.role === 'owner');

        if (!hasAdminRole && !teamId) {
          // User is a moderator/member - filter to only their teams
          const userTeamIds = memberships.map(m => m.teamId);

          if (userTeamIds.length === 0) {
            // User has no teams, return empty list
            return res.json([]);
          }

          where.teamId = { in: userTeamIds };
        }
      } catch (error) {
        console.error('Error checking team memberships:', error);
        // On error, continue without filtering (fail open)
      }
    }

    const list = await prisma.question.findMany({
      where,
      include: {
        team: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: search
        ? [{ createdAt: 'desc' }] // Search results ordered by relevance (already filtered by rank)
        : [{ upvotes: 'desc' }, { createdAt: 'asc' }], // Default ordering
    });
    res.json(list);
  });

  // Get a single question by ID
  // Get question by ID - requires authentication
  app.get('/questions/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          team: true,
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json(question);
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch question' });
    }
  });

  // Rate limited: 10 requests per minute per IP
  app.post(
    '/questions/:id/upvote',
    rateLimit('upvote', RATE_LIMITS.UPVOTE),
    requirePermission('question.upvote', { allowUnauthenticated: true }),
    async (req, res) => {
      const { id } = req.params;
      const userId = req.user?.id;

      try {
        // Check if question exists and get author info
        const question = await prisma.question.findUnique({
          where: { id },
          include: { author: true },
        });

        if (!question) {
          return res.status(404).json({ error: 'Question not found' });
        }

        // Prevent self-upvoting
        if (userId && question.authorId === userId) {
          return res.status(400).json({ error: 'Cannot upvote your own question' });
        }

        // Check if user has already upvoted this question
        if (userId) {
          const existingUpvote = await prisma.upvote.findUnique({
            where: {
              questionId_userId: {
                questionId: id,
                userId: userId,
              },
            },
          });

          if (existingUpvote) {
            return res.status(400).json({ error: 'Already upvoted this question' });
          }
        }

        // Create upvote record
        await prisma.upvote.create({
          data: {
            questionId: id,
            userId: userId || null,
          },
        });

        // Update the legacy upvotes counter (for backward compatibility)
        const updatedQuestion = await prisma.question.update({
          where: { id },
          data: { upvotes: { increment: 1 } },
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Publish SSE event for upvote
        eventBus.publish({
          type: 'question:upvoted',
          tenantId: req.tenant!.tenantId,
          data: updatedQuestion,
          timestamp: Date.now(),
        });

        res.json(updatedQuestion);
      } catch (error) {
        console.error('Upvote error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to upvote question' });
      }
    }
  );

  // Check if user has upvoted a question
  app.get('/questions/:id/upvote-status', sessionAuthMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      if (!userId) {
        return res.json({ hasUpvoted: false, canUpvote: false });
      }

      // Check if question exists and get author info
      const question = await prisma.question.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Check if user has upvoted
      const existingUpvote = await prisma.upvote.findUnique({
        where: {
          questionId_userId: {
            questionId: id,
            userId: userId,
          },
        },
      });

      const hasUpvoted = !!existingUpvote;
      const canUpvote = !hasUpvoted && question.authorId !== userId;

      res.json({ hasUpvoted, canUpvote });
    } catch (error) {
      console.error('Upvote status error:', error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to check upvote status' });
    }
  });

  const respondSchema = z.object({
    response: z.string().min(1).max(10000),
  });

  // Admin authentication endpoints
  const adminLoginSchema = z.object({
    adminKey: z.string().min(1),
  });

  app.post(
    '/admin/login',
    rateLimit('admin-login', 10, 60_000),
    validateCsrfToken(),
    async (req, res) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Admin login attempt:', {
          hasSession: !!req.session,
          sessionId: req.sessionID,
          userAgent: req.get('User-Agent')?.substring(0, 50),
        });
      }

      const parse = adminLoginSchema.safeParse(req.body);
      if (!parse.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Login failed: Invalid request body');
        }
        return res.status(400).json({ error: 'Admin key is required' });
      }

      if (parse.data.adminKey !== env.ADMIN_KEY) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Login failed: Invalid admin key');
        }
        return res.status(401).json({ error: 'Invalid admin key' });
      }

      // Set admin session
      req.session.isAdmin = true;
      req.session.loginTime = Date.now();

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Admin login successful:', {
          sessionId: req.sessionID,
          loginTime: req.session.loginTime,
        });
      }

      res.json({
        success: true,
        message: 'Admin login successful',
        expiresIn: TIME_CONSTANTS.SESSION_EXPIRY_MS, // 30 minutes
      });
    }
  );

  app.post('/admin/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  app.get('/admin/status', (req, res) => {
    const isAdmin = !!req.session?.isAdmin;
    const loginTime = req.session?.loginTime;

    res.json({
      isAuthenticated: isAdmin,
      loginTime: loginTime || null,
      sessionAge: loginTime ? Date.now() - loginTime : null,
    });
  });

  // Get tenant settings (admin only)
  app.get('/admin/settings', requirePermission('admin.access'), async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!tenant) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Tenant not found',
        });
      }

      res.json({
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error fetching tenant settings:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch settings',
        message: error.message,
      });
    }
  });

  // Update tenant settings (admin only)
  const updateTenantSettingsSchema = z.object({
    name: z.string().min(1).max(100).optional(),
  });

  app.patch('/admin/settings', requirePermission('admin.access'), async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const parse = updateTenantSettingsSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid request',
          details: parse.error.flatten(),
        });
      }

      const { name } = parse.data;

      // Build update data
      const updateData: any = {};
      if (name !== undefined) {
        updateData.name = name;
      }

      // Update tenant
      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
      });

      console.log(`✅ Admin: Updated tenant settings for "${tenant.name}"`);

      // Log audit event
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'tenant.update',
            entityType: 'tenant',
            entityId: tenant.id,
            metadata: { changes: updateData },
            tenantId,
          },
        });
      }

      res.json({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        },
        message: 'Settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating tenant settings:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update settings',
        message: error.message,
      });
    }
  });

  // Tenant settings endpoints (advanced configuration)
  app.get('/admin/tenant-settings', requirePermission('admin.access'), async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const { getTenantSettings } = await import('./lib/settingsService.js');
      const settings = await getTenantSettings(prisma, tenantId);

      res.json({
        settings,
      });
    } catch (error: any) {
      console.error('Error fetching tenant settings:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch tenant settings',
        message: error.message,
      });
    }
  });

  app.patch('/admin/tenant-settings', requirePermission('admin.access'), async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const { updateTenantSettings } = await import('./lib/settingsService.js');

      // Update settings
      const settings = await updateTenantSettings(prisma, tenantId, req.body);

      // Log the change
      if (req.user) {
        await auditService.log(req, {
          action: 'tenant.settings.update',
          entityType: 'TenantSettings',
          entityId: tenantId,
          metadata: { updates: req.body },
        });
      }

      res.json({
        success: true,
        settings,
        message: 'Tenant settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating tenant settings:', error);

      // Return validation errors with 400 status
      if (error.message && error.message.includes('must')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Validation failed',
          message: error.message,
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update tenant settings',
        message: error.message,
      });
    }
  });

  // Team management endpoints
  const createTeamSchema = z.object({
    name: z.string().min(1).max(DATABASE_LIMITS.MAX_TEAM_NAME),
    slug: z
      .string()
      .min(1)
      .max(DATABASE_LIMITS.MAX_TEAM_SLUG)
      .regex(
        VALIDATION_PATTERNS.TEAM_SLUG,
        'Slug must contain only lowercase letters, numbers, and hyphens'
      ),
    description: z
      .string()
      .max(DATABASE_LIMITS.MAX_TEAM_DESCRIPTION)
      .optional()
      .transform(val => (val === '' ? undefined : val)),
  });

  const updateTeamSchema = z.object({
    name: z.string().min(1).max(DATABASE_LIMITS.MAX_TEAM_NAME).optional(),
    description: z
      .string()
      .max(DATABASE_LIMITS.MAX_TEAM_DESCRIPTION)
      .optional()
      .transform(val => (val === '' ? undefined : val)),
    isActive: z.boolean().optional(),
  });

  // Get all teams (public endpoint)
  app.get('/teams', async (req, res) => {
    try {
      const teams = await prisma.team.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              questions: { where: { status: 'OPEN' } }, // Only count open questions
              memberships: true, // Count members
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch teams' });
    }
  });

  // Get team by slug (public endpoint)
  app.get('/teams/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
      const team = await prisma.team.findUnique({
        where: {
          tenantId_slug: {
            tenantId: req.tenant!.tenantId,
            slug,
          },
        },
        include: {
          _count: {
            select: {
              questions: { where: { status: 'OPEN' } }, // Only count open questions
              memberships: true, // Count members
            },
          },
        },
      });

      if (!team || !team.isActive) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json(team);
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  });

  // Create team (admin only)
  app.post('/teams', validateCsrfToken(), requirePermission('team.create'), async (req, res) => {
    const parse = createTeamSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    try {
      // Check if slug already exists in this tenant
      const existingTeam = await prisma.team.findUnique({
        where: {
          tenantId_slug: {
            tenantId: req.tenant!.tenantId,
            slug: parse.data.slug,
          },
        },
      });

      if (existingTeam) {
        return res.status(409).json({ error: 'Team with this slug already exists' });
      }

      const team = await prisma.team.create({
        data: {
          ...parse.data,
          tenantId: req.tenant!.tenantId,
        },
        include: {
          _count: {
            select: {
              questions: { where: { status: 'OPEN' } }, // Only count open questions
              memberships: true, // Count members
            },
          },
        },
      });

      // Audit log: team created
      await auditService.log(req, {
        action: 'team.create',
        entityType: 'Team',
        entityId: team.id,
        after: { id: team.id, name: team.name, slug: team.slug },
        metadata: { description: team.description },
      });

      res.status(201).json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ error: 'Failed to create team' });
    }
  });

  // Update team (admin only)
  app.put(
    '/teams/:id',
    validateCsrfToken(),
    requirePermission('team.edit', { teamIdParam: 'id' }),
    async (req, res) => {
      const { id } = req.params;
      const parse = updateTeamSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: parse.error.flatten() });
      }

      try {
        // Get team before update for audit log
        const beforeTeam = await prisma.team.findUnique({
          where: { id },
          select: { id: true, name: true, slug: true, description: true, isActive: true },
        });

        const team = await prisma.team.update({
          where: { id },
          data: parse.data,
          include: {
            _count: {
              select: {
                questions: { where: { status: 'OPEN' } }, // Only count open questions
                memberships: true, // Count members
              },
            },
          },
        });

        // Audit log: team updated
        await auditService.log(req, {
          action: 'team.update',
          entityType: 'Team',
          entityId: team.id,
          before: beforeTeam,
          after: {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            isActive: team.isActive,
          },
          metadata: { teamName: team.name },
        });

        res.json(team);
      } catch (error: any) {
        console.error('Error updating team:', error);
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Team not found' });
        }
        res.status(500).json({ error: 'Failed to update team' });
      }
    }
  );

  // Deactivate team (admin only) - soft delete
  app.delete(
    '/teams/:id',
    validateCsrfToken(),
    requirePermission('team.delete', { teamIdParam: 'id' }),
    async (req, res) => {
      const { id } = req.params;

      try {
        // Get team before deactivation for audit log
        const beforeTeam = await prisma.team.findUnique({
          where: { id },
          select: { id: true, name: true, slug: true, isActive: true },
        });

        const team = await prisma.team.update({
          where: { id },
          data: { isActive: false },
        });

        // Audit log: team deactivated
        await auditService.log(req, {
          action: 'team.deactivate',
          entityType: 'Team',
          entityId: team.id,
          before: beforeTeam,
          after: { id: team.id, isActive: false },
          metadata: { teamName: beforeTeam?.name },
        });

        res.json({ success: true, message: 'Team deactivated successfully' });
      } catch (error: any) {
        console.error('Error deactivating team:', error);
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Team not found' });
        }
        res.status(500).json({ error: 'Failed to deactivate team' });
      }
    }
  );

  // Protected by moderator or higher (question.answer permission)
  // Team-scoped: moderators can only answer questions from their teams
  app.post(
    '/questions/:id/respond',
    validateCsrfToken(),
    extractQuestionTeam(),
    requirePermission('question.answer', { teamIdParam: 'teamId' }),
    async (req, res) => {
      const { id } = req.params;
      const parse = respondSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });
      try {
        // Get question before update for audit log
        const beforeQuestion = await prisma.question.findUnique({
          where: { id },
          select: { id: true, body: true, status: true, responseText: true },
        });

        const q = await prisma.question.update({
          where: { id },
          data: {
            status: 'ANSWERED',
            responseText: parse.data.response,
            respondedAt: new Date(),
            reviewedBy: req.user?.id, // Track who reviewed/answered
            reviewedAt: new Date(),
          },
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Audit log: question answered
        await auditService.log(req, {
          action: 'question.answer',
          entityType: 'Question',
          entityId: q.id,
          before: beforeQuestion,
          after: { id: q.id, status: q.status, responseText: q.responseText },
          metadata: {
            questionBody: q.body.substring(0, AUDIT_CONSTANTS.MAX_ENTITY_DESCRIPTION_LENGTH),
            teamId: q.teamId,
            teamName: q.team?.name,
          },
        });

        // Publish SSE event for answer
        eventBus.publish({
          type: 'question:answered',
          tenantId: req.tenant!.tenantId,
          data: q,
          timestamp: Date.now(),
        });

        // Send email notification to question author (if they have notifications enabled)
        if (q.author) {
          try {
            // Check if author has email notifications enabled
            const authorPreferences = await prisma.userPreferences.findUnique({
              where: { userId: q.author.id },
            });

            if (!authorPreferences || authorPreferences.emailNotifications !== false) {
              // Queue email (non-blocking)
              const { queueQuestionAnsweredEmail } = await import('./lib/queue/emailQueue.js');
              const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

              await queueQuestionAnsweredEmail({
                to: q.author.email,
                toName: q.author.name || 'User',
                questionBody: q.body,
                answerBody: parse.data.response,
                responderName: req.user?.name || 'Moderator',
                questionUrl: `${baseUrl}/questions/${q.id}`,
                unsubscribeUrl: `${baseUrl}/profile?section=notifications`,
              });

              console.log(`📧 Queued email notification for ${q.author.email}`);
            }
          } catch (emailError) {
            // Don't fail the response if email queueing fails
            console.error('Failed to queue email notification:', emailError);
          }
        }

        res.json(q);
      } catch {
        res.status(404).json({ error: 'Not found' });
      }
    }
  );

  // Pin/unpin question (moderators+)
  app.post(
    '/questions/:id/pin',
    validateCsrfToken(),
    extractQuestionTeam(),
    requirePermission('question.pin', { teamIdParam: 'teamId' }),
    async (req, res) => {
      const { id } = req.params;

      try {
        const question = await prisma.question.findUnique({ where: { id } });
        if (!question) return res.status(404).json({ error: 'Question not found' });

        const newPinnedState = !question.isPinned;

        const updated = await prisma.question.update({
          where: { id },
          data: {
            isPinned: newPinnedState,
            pinnedBy: newPinnedState ? req.user?.id : null,
            pinnedAt: newPinnedState ? new Date() : null,
          },
          include: {
            team: true,
            tags: { include: { tag: true } },
          },
        });

        // Audit log
        await auditService.log(req, {
          action: newPinnedState ? 'question.pin' : 'question.unpin',
          entityType: 'Question',
          entityId: id,
          metadata: {
            questionBody: question.body.substring(0, 100),
          },
        });

        // Publish SSE event
        eventBus.publish({
          type: 'question:pinned',
          tenantId: req.tenant!.tenantId,
          data: updated,
          timestamp: Date.now(),
        });

        res.json(updated);
      } catch (error) {
        console.error('Error pinning question:', error);
        res.status(500).json({ error: 'Failed to pin question' });
      }
    }
  );

  // Freeze/unfreeze question (moderators+)
  app.post(
    '/questions/:id/freeze',
    validateCsrfToken(),
    extractQuestionTeam(),
    requirePermission('question.freeze', { teamIdParam: 'teamId' }),
    async (req, res) => {
      const { id } = req.params;

      try {
        const question = await prisma.question.findUnique({ where: { id } });
        if (!question) return res.status(404).json({ error: 'Question not found' });

        const newFrozenState = !question.isFrozen;

        const updated = await prisma.question.update({
          where: { id },
          data: {
            isFrozen: newFrozenState,
            frozenBy: newFrozenState ? req.user?.id : null,
            frozenAt: newFrozenState ? new Date() : null,
          },
          include: {
            team: true,
            tags: { include: { tag: true } },
          },
        });

        // Audit log
        await auditService.log(req, {
          action: newFrozenState ? 'question.freeze' : 'question.unfreeze',
          entityType: 'Question',
          entityId: id,
          metadata: {
            questionBody: question.body.substring(0, 100),
          },
        });

        // Publish SSE event
        eventBus.publish({
          type: 'question:frozen',
          tenantId: req.tenant!.tenantId,
          data: updated,
          timestamp: Date.now(),
        });

        res.json(updated);
      } catch (error) {
        console.error('Error freezing question:', error);
        res.status(500).json({ error: 'Failed to freeze question' });
      }
    }
  );

  // Legacy endpoint - disabled in production, available for dev/testing with admin key
  app.post(
    '/questions/:id/respond-legacy',
    (req, res, next) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
      }
      return requireAdminKey(req, res, next);
    },
    async (req, res) => {
      const { id } = req.params;
      const parse = respondSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });
      try {
        const q = await prisma.question.update({
          where: { id },
          data: {
            status: 'ANSWERED',
            responseText: parse.data.response,
            respondedAt: new Date(),
          },
        });
        res.json(q);
      } catch {
        res.status(404).json({ error: 'Not found' });
      }
    }
  );

  // Search questions endpoint with improved fuzzy matching
  // Search questions - requires authentication
  app.get('/questions/search', requireAuth, async (req, res) => {
    console.log('🔎 Search endpoint hit:', {
      query: req.query.q,
      teamId: req.query.teamId,
      user: req.user?.email,
    });

    const { q: query, teamId } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      console.log('🔎 Search: Query too short, returning empty array');
      return res.json([]);
    }

    const searchTerm = query.trim();

    try {
      // Extract meaningful keywords from the search query
      const extractKeywords = (text: string): string[] => {
        // Remove common stop words and extract meaningful terms
        const stopWords = new Set([
          'the',
          'a',
          'an',
          'and',
          'or',
          'but',
          'in',
          'on',
          'at',
          'to',
          'for',
          'of',
          'with',
          'by',
          'can',
          'you',
          'we',
          'i',
          'is',
          'are',
          'was',
          'were',
          'be',
          'been',
          'have',
          'has',
          'had',
          'do',
          'does',
          'did',
          'will',
          'would',
          'could',
          'should',
          'may',
          'might',
          'must',
          'shall',
          'about',
          'there',
          'when',
          'where',
          'why',
          'how',
          'what',
          'who',
          'which',
          'this',
          'that',
          'these',
          'those',
        ]);

        return text
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.has(word))
          .slice(0, 5); // Limit to 5 most relevant keywords
      };

      const keywords = extractKeywords(searchTerm);

      if (keywords.length === 0) {
        // Fallback to original search if no keywords extracted
        const whereClause: any = {
          OR: [
            {
              body: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              responseText: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        };

        // Add team filter if provided
        if (teamId && typeof teamId === 'string') {
          whereClause.teamId = teamId;
        }

        const questions = await prisma.question.findMany({
          where: whereClause,
          include: {
            team: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: [{ status: 'asc' }, { upvotes: 'desc' }, { createdAt: 'desc' }],
          take: DATABASE_LIMITS.DEFAULT_PAGINATION,
        });
        return res.json(questions);
      }

      // Build dynamic OR conditions for each keyword
      const bodyConditions = keywords.map(keyword => ({
        body: {
          contains: keyword,
          mode: 'insensitive' as const,
        },
      }));

      const responseConditions = keywords.map(keyword => ({
        responseText: {
          contains: keyword,
          mode: 'insensitive' as const,
        },
      }));

      // Search with keyword-based matching
      const searchWhereClause: any = {
        OR: [...bodyConditions, ...responseConditions],
      };

      // Add team filter if provided
      if (teamId && typeof teamId === 'string') {
        searchWhereClause.teamId = teamId;
      }

      const questions = await prisma.question.findMany({
        where: searchWhereClause,
        include: {
          team: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // OPEN questions first
          { upvotes: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
      });

      // Score and rank results based on keyword matches
      const scoredQuestions = questions.map(question => {
        let score = 0;
        const bodyLower = question.body.toLowerCase();
        const responseLower = (question.responseText || '').toLowerCase();

        // Score based on keyword matches
        keywords.forEach(keyword => {
          if (bodyLower.includes(keyword)) score += 2; // Body matches are more important
          if (responseLower.includes(keyword)) score += 1;
        });

        // Bonus for exact phrase matches
        if (bodyLower.includes(searchTerm.toLowerCase())) score += 5;
        if (responseLower.includes(searchTerm.toLowerCase())) score += 3;

        // Bonus for status and popularity
        if (question.status === 'OPEN') score += 1;
        score += question.upvotes * 0.1;

        return { ...question, searchScore: score };
      });

      // Sort by search score, then by original criteria
      const rankedQuestions = scoredQuestions
        .filter(q => q.searchScore > 0)
        .sort((a, b) => {
          if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
          if (a.status !== b.status) return a.status === 'OPEN' ? -1 : 1;
          if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, DATABASE_LIMITS.DEFAULT_SEARCH_LIMIT)
        .map(({ searchScore: _searchScore, ...question }) => question); // Remove score from response

      console.log('🔎 Search results:', { count: rankedQuestions.length, query: searchTerm });
      res.json(rankedQuestions);
    } catch (error) {
      console.error('🔎 Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Export endpoints (admin only)

  // Get export preview
  app.get('/admin/export/preview', requirePermission('data.export'), async (req, res) => {
    try {
      const filters = req.query;

      // Build where clause based on filters
      const where: any = {};

      // Team filter
      if (filters.teamId && filters.teamId !== 'all') {
        where.teamId = filters.teamId;
      }

      // Status filter
      if (filters.status && filters.status !== 'both' && typeof filters.status === 'string') {
        where.status = filters.status.toUpperCase();
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate as string);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate as string);
        }
      }

      // Upvote range filter
      if (filters.minUpvotes || filters.maxUpvotes) {
        where.upvotes = {};
        if (filters.minUpvotes) {
          where.upvotes.gte = parseInt(filters.minUpvotes as string);
        }
        if (filters.maxUpvotes) {
          where.upvotes.lte = parseInt(filters.maxUpvotes as string);
        }
      }

      // Tag filter (if specified)
      if (filters.tagIds) {
        const tagIds = Array.isArray(filters.tagIds) ? filters.tagIds : [filters.tagIds];
        where.tags = {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        };
      }

      // Response filter
      if (filters.hasResponse === 'true') {
        where.responseText = { not: null };
      } else if (filters.hasResponse === 'false') {
        where.responseText = null;
      }

      // Get questions with all related data
      const questions = await prisma.question.findMany({
        where,
        include: {
          team: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { upvotes: 'desc' }, { createdAt: 'desc' }],
        take: filters.limit ? parseInt(filters.limit as string) : DATABASE_LIMITS.EXPORT_PREVIEW, // Limit preview to 100
      });

      res.json({
        count: questions.length,
        preview: questions,
        filters: filters,
      });
    } catch (error) {
      console.error('Error fetching export preview:', error);
      res.status(500).json({ error: 'Failed to fetch export preview' });
    }
  });

  // Download export
  app.get('/admin/export/download', requirePermission('data.export'), async (req, res) => {
    try {
      const filters = req.query;
      const format = (filters.format as string) || 'csv';

      // Build where clause (same as preview)
      const where: any = {};

      if (filters.teamId && filters.teamId !== 'all') {
        where.teamId = filters.teamId;
      }

      if (filters.status && filters.status !== 'both' && typeof filters.status === 'string') {
        where.status = filters.status.toUpperCase();
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate as string);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate as string);
        }
      }

      if (filters.minUpvotes || filters.maxUpvotes) {
        where.upvotes = {};
        if (filters.minUpvotes) {
          where.upvotes.gte = parseInt(filters.minUpvotes as string);
        }
        if (filters.maxUpvotes) {
          where.upvotes.lte = parseInt(filters.maxUpvotes as string);
        }
      }

      if (filters.tagIds) {
        const tagIds = Array.isArray(filters.tagIds) ? filters.tagIds : [filters.tagIds];
        where.tags = {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        };
      }

      if (filters.hasResponse === 'true') {
        where.responseText = { not: null };
      } else if (filters.hasResponse === 'false') {
        where.responseText = null;
      }

      // Get all questions matching filters
      const questions = await prisma.question.findMany({
        where,
        include: {
          team: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { upvotes: 'desc' }, { createdAt: 'desc' }],
      });

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = [
          'id',
          'body',
          'upvotes',
          'status',
          'responseText',
          'respondedAt',
          'createdAt',
          'updatedAt',
          'teamId',
          'teamName',
          'teamSlug',
          'tags',
        ];

        const csvRows = questions.map(q => {
          const tags = q.tags.map(qt => `${qt.tag.name}(${qt.tag.id})`).join(';');
          return [
            q.id,
            `"${q.body.replace(/"/g, '""')}"`, // Escape quotes in CSV
            q.upvotes,
            q.status,
            q.responseText ? `"${q.responseText.replace(/"/g, '""')}"` : '',
            q.respondedAt?.toISOString() || '',
            q.createdAt.toISOString(),
            q.updatedAt.toISOString(),
            q.teamId || '',
            q.team?.name || '',
            q.team?.slug || '',
            `"${tags}"`,
          ].join(',');
        });

        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="ama-export-${new Date().toISOString().split('T')[0]}.csv"`
        );
        res.send(csvContent);
      } else if (format === 'json') {
        // Generate JSON
        const exportData = {
          exportedAt: new Date().toISOString(),
          filters: filters,
          totalCount: questions.length,
          questions: questions.map(q => ({
            ...q,
            createdAt: q.createdAt.toISOString(),
            updatedAt: q.updatedAt.toISOString(),
            respondedAt: q.respondedAt?.toISOString() || null,
            team: q.team
              ? {
                  ...q.team,
                  createdAt: q.team.createdAt.toISOString(),
                  updatedAt: q.team.updatedAt.toISOString(),
                }
              : null,
            tags: q.tags.map(qt => ({
              ...qt,
              createdAt: qt.createdAt.toISOString(),
              tag: {
                ...qt.tag,
                createdAt: qt.tag.createdAt.toISOString(),
                updatedAt: qt.tag.updatedAt.toISOString(),
              },
            })),
          })),
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="ama-export-${new Date().toISOString().split('T')[0]}.json"`
        );
        res.json(exportData);
      } else {
        res.status(400).json({ error: 'Invalid format. Use csv or json.' });
      }
    } catch (error) {
      console.error('Error generating export:', error);
      res.status(500).json({ error: 'Failed to generate export' });
    }
  });

  // Tag endpoints (admin only)

  // Get all tags
  app.get('/tags', requirePermission('tag.view'), async (_req, res) => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
      });
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Create a new tag
  app.post('/tags', validateCsrfToken(), requirePermission('tag.create'), async (req, res) => {
    const createTagSchema = z.object({
      name: z.string().min(1).max(DATABASE_LIMITS.MAX_TAG_NAME),
      description: z.string().max(DATABASE_LIMITS.MAX_TAG_DESCRIPTION).nullable().optional(),
      color: z.string().regex(VALIDATION_PATTERNS.HEX_COLOR).optional(),
    });

    const parse = createTagSchema.safeParse(req.body);
    if (!parse.success)
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });

    try {
      const tag = await prisma.tag.create({
        data: {
          name: parse.data.name,
          description: parse.data.description,
          color: parse.data.color || '#3B82F6',
          tenantId: req.tenant!.tenantId,
        },
      });

      // Audit log: tag created
      await auditService.log(req, {
        action: 'tag.create',
        entityType: 'Tag',
        entityId: tag.id,
        after: { id: tag.id, name: tag.name, color: tag.color },
        metadata: { description: tag.description },
      });

      res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ error: 'Tag with this name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create tag' });
      }
    }
  });

  // Add tag to question
  // Team-scoped: moderators can only tag questions from their teams
  app.post(
    '/questions/:id/tags',
    validateCsrfToken(),
    extractQuestionTeam(),
    requirePermission('question.tag', { teamIdParam: 'teamId' }),
    async (req, res) => {
      const { id } = req.params;
      const addTagSchema = z.object({
        tagId: z.string().uuid(),
      });

      const parse = addTagSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });

      try {
        // Check if question exists
        const question = await prisma.question.findUnique({ where: { id } });
        if (!question) return res.status(404).json({ error: 'Question not found' });

        // Check if tag exists
        const tag = await prisma.tag.findUnique({ where: { id: parse.data.tagId } });
        if (!tag) return res.status(404).json({ error: 'Tag not found' });

        // Add tag to question (handle duplicates gracefully)
        try {
          await prisma.questionTag.create({
            data: {
              questionId: id,
              tagId: parse.data.tagId,
            },
          });
        } catch (createError: any) {
          // If tag already exists (P2002 = unique constraint), that's fine - ignore it
          if (createError.code !== 'P2002') {
            throw createError;
          }
        }

        // Get updated question with tags for SSE event
        const updatedQuestion = await prisma.question.findUnique({
          where: { id },
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Audit log: tag added to question
        if (updatedQuestion) {
          await auditService.log(req, {
            action: 'question.tag.add',
            entityType: 'Question',
            entityId: updatedQuestion.id,
            metadata: {
              questionBody: updatedQuestion.body.substring(0, 100),
              tagId: parse.data.tagId,
              tagName: tag.name,
            },
          });

          // Publish SSE event for tag addition
          eventBus.publish({
            type: 'question:tagged',
            tenantId: req.tenant!.tenantId,
            data: updatedQuestion,
            timestamp: Date.now(),
          });
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Error adding tag to question:', error);
        res.status(500).json({ error: 'Failed to add tag to question' });
      }
    }
  );

  // Remove tag from question
  // Team-scoped: moderators can only untag questions from their teams
  app.delete(
    '/questions/:id/tags/:tagId',
    validateCsrfToken(),
    extractQuestionTeam(),
    requirePermission('question.tag', { teamIdParam: 'teamId' }),
    async (req, res) => {
      const { id, tagId } = req.params;

      try {
        // Get tag name before deletion for audit log
        const tag = await prisma.tag.findUnique({
          where: { id: tagId },
          select: { name: true },
        });

        // Remove tag from question (handle not found gracefully)
        try {
          await prisma.questionTag.delete({
            where: {
              questionId_tagId: {
                questionId: id,
                tagId: tagId,
              },
            },
          });
        } catch (deleteError: any) {
          // If tag doesn't exist on question (P2025 = record not found), that's fine - ignore it
          if (deleteError.code !== 'P2025') {
            throw deleteError;
          }
        }

        // Get updated question for SSE event and audit
        const updatedQuestion = await prisma.question.findUnique({
          where: { id },
          include: {
            team: true,
            author: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        // Audit log: tag removed from question
        if (updatedQuestion) {
          await auditService.log(req, {
            action: 'question.tag.remove',
            entityType: 'Question',
            entityId: updatedQuestion.id,
            metadata: {
              questionBody: updatedQuestion.body.substring(0, 100),
              tagId,
              tagName: tag?.name,
            },
          });

          // Publish SSE event for tag removal
          eventBus.publish({
            type: 'question:untagged',
            tenantId: req.tenant!.tenantId,
            data: updatedQuestion,
            timestamp: Date.now(),
          });
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Error removing tag from question:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
          res.status(404).json({ error: 'Tag not found on question' });
        } else {
          res.status(500).json({ error: 'Failed to remove tag from question' });
        }
      }
    }
  );

  // Audit log endpoints (admin only)

  // Get audit logs
  app.get('/admin/audit', requirePermission('audit.view'), async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : AUDIT_CONSTANTS.DEFAULT_EXPORT_LIMIT,
        offset: req.query.offset
          ? parseInt(req.query.offset as string)
          : AUDIT_CONSTANTS.DEFAULT_EXPORT_OFFSET,
      };

      const logs = await auditService.getLogs(req.tenant!.tenantId, filters);
      const total = await auditService.getCount(req.tenant!.tenantId, {
        userId: filters.userId,
        action: filters.action,
        entityType: filters.entityType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      res.json({
        logs,
        total,
        limit: filters.limit,
        offset: filters.offset,
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // Export audit logs
  app.get('/admin/audit/export', requirePermission('audit.view'), async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        entityType: req.query.entityType as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: 10000, // Large limit for exports
      };

      const format = (req.query.format as string) || 'csv';
      const logs = await auditService.getLogs(req.tenant!.tenantId, filters);

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = [
          'timestamp',
          'user_email',
          'user_name',
          'action',
          'entity_type',
          'entity_id',
          'ip_address',
          'user_agent',
          'metadata',
        ];

        const csvRows = logs.map(log => {
          return [
            log.createdAt.toISOString(),
            log.user?.email || 'system',
            log.user?.name || 'System',
            log.action,
            log.entityType,
            log.entityId || '',
            log.ipAddress || '',
            `"${(log.userAgent || '').replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`,
          ].join(',');
        });

        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`
        );
        res.send(csvContent);
      } else if (format === 'json') {
        // Generate JSON
        const exportData = {
          exportedAt: new Date().toISOString(),
          tenant: req.tenant!.tenantSlug,
          filters,
          totalRecords: logs.length,
          logs: logs.map(log => ({
            timestamp: log.createdAt.toISOString(),
            userId: log.userId,
            userEmail: log.user?.email,
            userName: log.user?.name,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            before: log.before,
            after: log.after,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            metadata: log.metadata,
          })),
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.json"`
        );
        res.json(exportData);
      } else {
        res.status(400).json({ error: 'Invalid format. Use csv or json.' });
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({ error: 'Failed to export audit logs' });
    }
  });

  // Moderation queue - get questions that need review
  app.get('/admin/moderation-queue', requirePermission('admin.access'), async (req, res) => {
    try {
      const { status, teamId, isPinned, isFrozen, needsReview, reviewedBy, limit, offset } =
        req.query;

      const where: any = {
        tenantId: req.tenant!.tenantId,
      };

      // Status filter
      if (status === 'open') {
        where.status = 'OPEN';
      } else if (status === 'answered') {
        where.status = 'ANSWERED';
      }

      // Team filter
      if (teamId) {
        where.teamId = teamId;
      }

      // Pinned filter
      if (isPinned === 'true') {
        where.isPinned = true;
      } else if (isPinned === 'false') {
        where.isPinned = false;
      }

      // Frozen filter
      if (isFrozen === 'true') {
        where.isFrozen = true;
      } else if (isFrozen === 'false') {
        where.isFrozen = false;
      }

      // Needs review filter (not reviewed yet)
      if (needsReview === 'true') {
        where.reviewedBy = null;
        where.status = 'OPEN';
      }

      // Reviewed by specific user
      if (reviewedBy) {
        where.reviewedBy = reviewedBy;
      }

      // Team scoping: Moderators can only see questions from teams they moderate
      // Admins and owners have global access to all teams
      if (req.user) {
        const memberships = await prisma.teamMembership.findMany({
          where: { userId: req.user.id },
          select: { role: true, teamId: true },
        });

        const hasGlobalAccess = memberships.some(m => m.role === 'admin' || m.role === 'owner');

        if (!hasGlobalAccess) {
          // User is a moderator - filter to only their teams
          const userTeamIds = memberships.map(m => m.teamId);

          if (userTeamIds.length === 0) {
            // Moderator has no teams, return empty
            return res.json({
              questions: [],
              total: 0,
              limit: limit ? parseInt(limit as string) : MODERATION.DEFAULT_QUEUE_LIMIT,
              offset: offset ? parseInt(offset as string) : MODERATION.DEFAULT_QUEUE_OFFSET,
            });
          }

          // If teamId filter is specified, verify moderator has access to that team
          if (teamId && !userTeamIds.includes(teamId as string)) {
            return res.status(403).json({ error: 'Access denied to this team' });
          }

          // Apply team filter for moderators
          where.teamId = teamId ? (teamId as string) : { in: userTeamIds };
        }
      }

      const questions = await prisma.question.findMany({
        where,
        include: {
          team: true,
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { upvotes: 'desc' }, { createdAt: 'desc' }],
        take: limit ? parseInt(limit as string) : MODERATION.DEFAULT_QUEUE_LIMIT,
        skip: offset ? parseInt(offset as string) : MODERATION.DEFAULT_QUEUE_OFFSET,
      });

      const total = await prisma.question.count({ where });

      res.json({
        questions,
        total,
        limit: limit ? parseInt(limit as string) : MODERATION.DEFAULT_QUEUE_LIMIT,
        offset: offset ? parseInt(offset as string) : MODERATION.DEFAULT_QUEUE_OFFSET,
      });
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      res.status(500).json({ error: 'Failed to fetch moderation queue' });
    }
  });

  // Bulk tag operation
  app.post(
    '/admin/bulk-tag',
    validateCsrfToken(),
    requirePermission('question.tag'),
    async (req, res) => {
      const bulkTagSchema = z.object({
        questionIds: z.array(z.string().uuid()).min(1),
        tagId: z.string().uuid(),
        action: z.enum(['add', 'remove']),
      });

      const parse = bulkTagSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });

      try {
        const { questionIds, tagId, action } = parse.data;

        // Verify tag exists
        const tag = await prisma.tag.findUnique({ where: { id: tagId } });
        if (!tag) return res.status(404).json({ error: 'Tag not found' });

        let successCount = 0;
        let errorCount = 0;

        if (action === 'add') {
          // Add tag to all questions
          for (const questionId of questionIds) {
            try {
              await prisma.questionTag.create({
                data: {
                  questionId,
                  tagId,
                },
              });
              successCount++;
            } catch (err: any) {
              // If tag already exists (P2002), count as success
              if (err.code === 'P2002') {
                successCount++;
              } else {
                errorCount++;
                console.error(`Failed to add tag to question ${questionId}:`, err);
              }
            }
          }
        } else {
          // Remove tag from all questions
          for (const questionId of questionIds) {
            try {
              await prisma.questionTag.delete({
                where: {
                  questionId_tagId: {
                    questionId,
                    tagId,
                  },
                },
              });
              successCount++;
            } catch (err: any) {
              // If tag doesn't exist on question (P2025), count as success
              if (err.code === 'P2025') {
                successCount++;
              } else {
                errorCount++;
                console.error(`Failed to remove tag from question ${questionId}:`, err);
              }
            }
          }
        }

        // Audit log
        await auditService.log(req, {
          action: `bulk.tag.${action}`,
          entityType: 'Question',
          entityId: 'multiple',
          metadata: {
            questionIds,
            tagId,
            tagName: tag.name,
            successCount,
            errorCount,
          },
        });

        // Publish SSE events for each affected question
        for (const questionId of questionIds) {
          const updatedQuestion = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
              team: true,
              tags: { include: { tag: true } },
            },
          });

          if (updatedQuestion) {
            eventBus.publish({
              type: action === 'add' ? 'question:tagged' : 'question:untagged',
              tenantId: req.tenant!.tenantId,
              data: updatedQuestion,
              timestamp: Date.now(),
            });
          }
        }

        res.json({
          success: true,
          successCount,
          errorCount,
          total: questionIds.length,
        });
      } catch (error) {
        console.error('Error in bulk tag operation:', error);
        res.status(500).json({ error: 'Failed to perform bulk tag operation' });
      }
    }
  );

  // Bulk action operation (pin, freeze, delete)
  app.post(
    '/admin/bulk-action',
    validateCsrfToken(),
    requirePermission('admin.access'),
    async (req, res) => {
      const bulkActionSchema = z.object({
        questionIds: z.array(z.string().uuid()).min(1),
        action: z.enum(['pin', 'unpin', 'freeze', 'unfreeze', 'delete']),
      });

      const parse = bulkActionSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: parse.error.flatten() });

      try {
        const { questionIds, action } = parse.data;

        let successCount = 0;
        let errorCount = 0;

        for (const questionId of questionIds) {
          try {
            switch (action) {
              case 'pin':
                await prisma.question.update({
                  where: { id: questionId },
                  data: {
                    isPinned: true,
                    pinnedBy: req.user?.id,
                    pinnedAt: new Date(),
                  },
                });
                break;

              case 'unpin':
                await prisma.question.update({
                  where: { id: questionId },
                  data: {
                    isPinned: false,
                    pinnedBy: null,
                    pinnedAt: null,
                  },
                });
                break;

              case 'freeze':
                await prisma.question.update({
                  where: { id: questionId },
                  data: {
                    isFrozen: true,
                    frozenBy: req.user?.id,
                    frozenAt: new Date(),
                  },
                });
                break;

              case 'unfreeze':
                await prisma.question.update({
                  where: { id: questionId },
                  data: {
                    isFrozen: false,
                    frozenBy: null,
                    frozenAt: null,
                  },
                });
                break;

              case 'delete':
                await prisma.question.delete({
                  where: { id: questionId },
                });
                break;
            }
            successCount++;

            // Publish SSE event
            if (action !== 'delete') {
              const updatedQuestion = await prisma.question.findUnique({
                where: { id: questionId },
                include: {
                  team: true,
                  tags: { include: { tag: true } },
                },
              });

              if (updatedQuestion) {
                const eventType =
                  action === 'pin' || action === 'unpin' ? 'question:pinned' : 'question:frozen';
                eventBus.publish({
                  type: eventType,
                  tenantId: req.tenant!.tenantId,
                  data: updatedQuestion,
                  timestamp: Date.now(),
                });
              }
            }
          } catch (err) {
            errorCount++;
            console.error(`Failed to ${action} question ${questionId}:`, err);
          }
        }

        // Audit log
        await auditService.log(req, {
          action: `bulk.${action}`,
          entityType: 'Question',
          entityId: 'multiple',
          metadata: {
            questionIds,
            successCount,
            errorCount,
          },
        });

        res.json({
          success: true,
          successCount,
          errorCount,
          total: questionIds.length,
        });
      } catch (error) {
        console.error('Error in bulk action operation:', error);
        res.status(500).json({ error: 'Failed to perform bulk action' });
      }
    }
  );

  // Moderation stats - get stats per moderator
  app.get('/admin/stats/moderation', requirePermission('admin.access'), async (req, res) => {
    try {
      const { teamId, startDate, endDate } = req.query;

      const where: any = {
        tenantId: req.tenant!.tenantId,
        reviewedBy: { not: null },
      };

      // Team scoping: Moderators can only see stats from teams they moderate
      // Admins and owners have global access to all team stats
      let allowedTeamIds: string[] | null = null;

      if (req.user) {
        const memberships = await prisma.teamMembership.findMany({
          where: { userId: req.user.id },
          select: { role: true, teamId: true },
        });

        const hasGlobalAccess = memberships.some(m => m.role === 'admin' || m.role === 'owner');

        if (!hasGlobalAccess) {
          // User is a moderator - filter to only their teams
          allowedTeamIds = memberships.map(m => m.teamId);

          if (allowedTeamIds.length === 0) {
            // Moderator has no teams, return empty stats
            return res.json({
              overall: {
                totalQuestionsReviewed: 0,
                totalQuestionsAnswered: 0,
                totalQuestionsPinned: 0,
                totalQuestionsFrozen: 0,
                activeModerators: 0,
                avgResponseTime: null,
              },
              byModerator: [],
            });
          }

          // If teamId filter is specified, verify moderator has access
          if (teamId && !allowedTeamIds.includes(teamId as string)) {
            return res.status(403).json({ error: 'Access denied to this team' });
          }
        }
      }

      // Team filter
      if (teamId) {
        where.teamId = teamId as string;
      } else if (allowedTeamIds) {
        // Apply moderator's team restriction if no specific team requested
        where.teamId = { in: allowedTeamIds };
      }

      // Date range filter - parse as UTC boundaries to include full days
      if (startDate || endDate) {
        where.reviewedAt = {};
        if (startDate) {
          // Parse as YYYY-MM-DD and set to start of day (00:00:00 UTC)
          where.reviewedAt.gte = new Date(startDate + 'T00:00:00.000Z');
        }
        if (endDate) {
          // Parse as YYYY-MM-DD and set to end of day (23:59:59.999 UTC)
          where.reviewedAt.lte = new Date(endDate + 'T23:59:59.999Z');
        }
      }

      // Get all reviewed questions with reviewer info
      const reviewedQuestions = await prisma.question.findMany({
        where,
        include: {
          team: true,
        },
      });

      // Group by reviewer
      const statsByModerator: Record<
        string,
        {
          moderatorId: string;
          questionsReviewed: number;
          questionsAnswered: number;
          questionsPinned: number;
          questionsFrozen: number;
          avgResponseTime: number | null;
          teams: Set<string>;
        }
      > = {};

      for (const question of reviewedQuestions) {
        const modId = question.reviewedBy!;

        if (!statsByModerator[modId]) {
          statsByModerator[modId] = {
            moderatorId: modId,
            questionsReviewed: 0,
            questionsAnswered: 0,
            questionsPinned: 0,
            questionsFrozen: 0,
            avgResponseTime: null,
            teams: new Set(),
          };
        }

        const stats = statsByModerator[modId];
        stats.questionsReviewed++;

        if (question.status === 'ANSWERED') {
          stats.questionsAnswered++;
        }

        if (question.isPinned) {
          stats.questionsPinned++;
        }

        if (question.isFrozen) {
          stats.questionsFrozen++;
        }

        if (question.teamId) {
          stats.teams.add(question.teamId);
        }
      }

      // Calculate average response times
      for (const modId of Object.keys(statsByModerator)) {
        const moderatorQuestions = reviewedQuestions.filter(
          q => q.reviewedBy === modId && q.respondedAt
        );

        if (moderatorQuestions.length > 0) {
          const totalTime = moderatorQuestions.reduce((sum, q) => {
            const created = new Date(q.createdAt).getTime();
            const responded = new Date(q.respondedAt!).getTime();
            return sum + (responded - created);
          }, 0);

          statsByModerator[modId].avgResponseTime = Math.round(
            totalTime /
              moderatorQuestions.length /
              TIME_CONSTANTS.AUDIT_RESPONSE_TIME_CONVERSION.MS_TO_SECONDS /
              TIME_CONSTANTS.AUDIT_RESPONSE_TIME_CONVERSION.SECONDS_TO_MINUTES
          ); // Convert to minutes
        }
      }

      // Get moderator user info
      const moderatorIds = Object.keys(statsByModerator);
      const moderators = await prisma.user.findMany({
        where: {
          id: { in: moderatorIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Combine stats with user info
      const stats = moderators.map(mod => ({
        ...statsByModerator[mod.id],
        moderatorName: mod.name,
        moderatorEmail: mod.email,
        teamsCount: statsByModerator[mod.id].teams.size,
        teams: undefined, // Remove the Set object
      }));

      // Overall stats
      const overall = {
        totalQuestionsReviewed: reviewedQuestions.length,
        totalQuestionsAnswered: reviewedQuestions.filter(q => q.status === 'ANSWERED').length,
        totalQuestionsPinned: reviewedQuestions.filter(q => q.isPinned).length,
        totalQuestionsFrozen: reviewedQuestions.filter(q => q.isFrozen).length,
        activeModerators: moderatorIds.length,
        avgResponseTime:
          stats.length > 0
            ? Math.round(stats.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) / stats.length)
            : null,
      };

      res.json({
        overall,
        byModerator: stats.sort((a, b) => b.questionsReviewed - a.questionsReviewed),
      });
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      res.status(500).json({ error: 'Failed to fetch moderation stats' });
    }
  });

  // User management endpoints
  // Authentication handled by sessionAuthMiddleware

  // Get current user
  app.get('/users/me', requireSessionAuth, (req, res) => {
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      ssoId: req.user!.ssoId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // Get user's questions
  app.get('/users/me/questions', requireSessionAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const questions = await prisma.question.findMany({
        where: {
          authorId: userId, // Query for questions authored by this user
        },
        include: {
          team: true,
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(questions);
    } catch (error) {
      console.error('Error fetching user questions:', error);
      res.status(500).json({ error: 'Failed to fetch user questions' });
    }
  });

  // Get user teams with membership info
  app.get('/users/me/teams', requireSessionAuth, async (req, res) => {
    try {
      const userTeams = await getUserTeamsWithMembership(req.user!.id, prisma);
      const preferences = await getUserPreferences(req.user!.id);

      res.json({
        teams: userTeams,
        favorites: preferences.favoriteTeams,
        defaultTeam: userTeams.find((t: any) => t.id === preferences.defaultTeamId) || null,
      });
    } catch (error) {
      console.error('Error fetching user teams:', error);
      res.status(500).json({ error: 'Failed to fetch user teams' });
    }
  });

  // Update user preferences
  app.put('/users/me/preferences', requireSessionAuth, async (req, res) => {
    const { favoriteTeams, defaultTeamId, emailNotifications } = req.body;
    const userId = req.user!.id;

    try {
      // Build update object with only provided fields
      const updateData: any = {};
      if (favoriteTeams !== undefined) updateData.favoriteTeams = favoriteTeams;
      if (defaultTeamId !== undefined) updateData.defaultTeamId = defaultTeamId;
      if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

      // Update database
      const updatedPreferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          tenantId: req.tenant!.tenantId,
          favoriteTeams: favoriteTeams || [],
          defaultTeamId: defaultTeamId || null,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        },
        include: {
          defaultTeam: true,
        },
      });

      // Update mock data cache
      await setUserPreferences(userId, {
        favoriteTeams: updatedPreferences.favoriteTeams as string[],
        defaultTeamId: updatedPreferences.defaultTeamId || null,
        emailNotifications: updatedPreferences.emailNotifications,
      });

      res.json(updatedPreferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // Toggle team favorite
  app.post('/users/me/teams/:teamId/favorite', requireSessionAuth, async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user!.id;

    const isFavorite = await toggleTeamFavorite(userId, teamId);

    res.json({ isFavorite });
  });

  // ========================================
  // Admin User Management Endpoints
  // ========================================

  // Get all users with their team memberships (admin only)
  app.get('/admin/users', requirePermission('admin.access'), async (req, res) => {
    try {
      const tenantId = req.tenant?.tenantId;
      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      const users = await prisma.user.findMany({
        where: { tenantId },
        include: {
          teamMemberships: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  isActive: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              questions: true,
              upvotes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          ssoId: user.ssoId,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          memberships: user.teamMemberships.map(m => ({
            id: m.id,
            teamId: m.teamId,
            role: m.role,
            createdAt: m.createdAt.toISOString(),
            team: m.team,
          })),
          _count: user._count,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch users',
        message: error.message,
      });
    }
  });

  // Get team members (admin only)
  app.get('/teams/:teamId/members', requirePermission('admin.access'), async (req, res) => {
    try {
      const { teamId } = req.params;
      const tenantId = req.tenant?.tenantId;

      if (!tenantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Tenant not resolved',
        });
      }

      // Verify team exists and belongs to tenant
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team || team.tenantId !== tenantId) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Team not found',
        });
      }

      const memberships = await prisma.teamMembership.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              ssoId: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // owner, admin, moderator, member
          { createdAt: 'asc' },
        ],
      });

      res.json({
        members: memberships.map(m => ({
          id: m.id,
          userId: m.userId,
          teamId: m.teamId,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
          user: {
            ...m.user,
            createdAt: m.user.createdAt.toISOString(),
          },
        })),
      });
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch team members',
        message: error.message,
      });
    }
  });

  // Add member to team (admin only)
  const addTeamMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['member', 'moderator', 'admin', 'owner']).default('member'),
  });

  app.post(
    '/teams/:teamId/members',
    validateCsrfToken(),
    requirePermission('admin.access'),
    async (req, res) => {
      try {
        const { teamId } = req.params;
        const tenantId = req.tenant?.tenantId;

        if (!tenantId) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Tenant not resolved',
          });
        }

        const parse = addTeamMemberSchema.safeParse(req.body);
        if (!parse.success) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Invalid request',
            details: parse.error.flatten(),
          });
        }

        const { userId, role } = parse.data;

        // Verify team exists and belongs to tenant
        const team = await prisma.team.findUnique({
          where: { id: teamId },
        });

        if (!team || team.tenantId !== tenantId) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'Team not found',
          });
        }

        // Verify user exists and belongs to tenant
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.tenantId !== tenantId) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'User not found',
          });
        }

        // Check if membership already exists
        const existingMembership = await prisma.teamMembership.findFirst({
          where: {
            userId,
            teamId,
          },
        });

        if (existingMembership) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            error: 'User is already a member of this team',
            message: 'Use PUT to update the role instead',
          });
        }

        // Create membership
        const membership = await prisma.teamMembership.create({
          data: {
            userId,
            teamId,
            role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        console.log(`✅ Admin: Added user ${user.email} to team ${team.name} with role ${role}`);

        // Audit log
        if (req.user) {
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'team.member.add',
              entityType: 'team',
              entityId: teamId,
              metadata: { userId, role, teamName: team.name, userEmail: user.email },
              tenantId,
            },
          });
        }

        res.json({
          success: true,
          membership: {
            id: membership.id,
            userId: membership.userId,
            teamId: membership.teamId,
            role: membership.role,
            createdAt: membership.createdAt.toISOString(),
            user: membership.user,
            team: membership.team,
          },
          message: 'User added to team successfully',
        });
      } catch (error: any) {
        console.error('Error adding team member:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to add team member',
          message: error.message,
        });
      }
    }
  );

  // Update team member role (admin only)
  const updateTeamMemberSchema = z.object({
    role: z.enum(['member', 'moderator', 'admin', 'owner']),
  });

  app.put(
    '/teams/:teamId/members/:userId',
    validateCsrfToken(),
    requirePermission('admin.access'),
    async (req, res) => {
      try {
        const { teamId, userId } = req.params;
        const tenantId = req.tenant?.tenantId;

        if (!tenantId) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Tenant not resolved',
          });
        }

        const parse = updateTeamMemberSchema.safeParse(req.body);
        if (!parse.success) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Invalid request',
            details: parse.error.flatten(),
          });
        }

        const { role } = parse.data;

        // Verify team exists and belongs to tenant
        const team = await prisma.team.findUnique({
          where: { id: teamId },
        });

        if (!team || team.tenantId !== tenantId) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'Team not found',
          });
        }

        // Verify user exists and belongs to tenant
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.tenantId !== tenantId) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'User not found',
          });
        }

        // Find membership
        const membership = await prisma.teamMembership.findFirst({
          where: {
            userId,
            teamId,
          },
        });

        if (!membership) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'User is not a member of this team',
          });
        }

        // Update role
        const updatedMembership = await prisma.teamMembership.update({
          where: { id: membership.id },
          data: { role },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        console.log(
          `✅ Admin: Updated ${user.email} role in team ${team.name} from ${membership.role} to ${role}`
        );

        // Audit log
        if (req.user) {
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'team.member.update',
              entityType: 'team',
              entityId: teamId,
              metadata: {
                userId,
                oldRole: membership.role,
                newRole: role,
                teamName: team.name,
                userEmail: user.email,
              },
              tenantId,
            },
          });
        }

        res.json({
          success: true,
          membership: {
            id: updatedMembership.id,
            userId: updatedMembership.userId,
            teamId: updatedMembership.teamId,
            role: updatedMembership.role,
            createdAt: updatedMembership.createdAt.toISOString(),
            user: updatedMembership.user,
            team: updatedMembership.team,
          },
          message: 'User role updated successfully',
        });
      } catch (error: any) {
        console.error('Error updating team member role:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to update team member role',
          message: error.message,
        });
      }
    }
  );

  // Remove member from team (admin only)
  app.delete(
    '/teams/:teamId/members/:userId',
    validateCsrfToken(),
    requirePermission('admin.access'),
    async (req, res) => {
      try {
        const { teamId, userId } = req.params;
        const tenantId = req.tenant?.tenantId;

        if (!tenantId) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Tenant not resolved',
          });
        }

        // Verify team exists and belongs to tenant
        const team = await prisma.team.findUnique({
          where: { id: teamId },
        });

        if (!team || team.tenantId !== tenantId) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'Team not found',
          });
        }

        // Verify user exists and belongs to tenant
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.tenantId !== tenantId) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'User not found',
          });
        }

        // Find membership
        const membership = await prisma.teamMembership.findFirst({
          where: {
            userId,
            teamId,
          },
        });

        if (!membership) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            error: 'User is not a member of this team',
          });
        }

        // Check if this is the last owner
        if (membership.role === 'owner') {
          const ownerCount = await prisma.teamMembership.count({
            where: {
              teamId,
              role: 'owner',
            },
          });

          if (ownerCount <= 1) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
              error: 'Cannot remove the last owner from a team',
              message:
                'Assign another member as owner before removing this user, or delete the team instead',
            });
          }
        }

        // Delete membership
        await prisma.teamMembership.delete({
          where: { id: membership.id },
        });

        console.log(`✅ Admin: Removed user ${user.email} from team ${team.name}`);

        // Audit log
        if (req.user) {
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'team.member.remove',
              entityType: 'team',
              entityId: teamId,
              metadata: {
                removedUserId: userId,
                role: membership.role,
                teamName: team.name,
                userEmail: user.email,
              },
              tenantId,
            },
          });
        }

        res.json({
          success: true,
          message: 'User removed from team successfully',
        });
      } catch (error: any) {
        console.error('Error removing team member:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to remove team member',
          message: error.message,
        });
      }
    }
  );

  // ============================================================================
  // ERROR HANDLERS (must be last)
  // ============================================================================

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler - catches all errors
  app.use(errorHandler);

  return app;
}
