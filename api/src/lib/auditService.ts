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

import { PrismaClient, Prisma } from '@prisma/client';
import { Request } from 'express';
import { getTenantContext } from '../middleware/tenantContext.js';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string;
  before?: any;
  after?: any;
  metadata?: any;
}

/**
 * Clean metadata by removing null and undefined values
 * Returns null if the result would be an empty object
 */
export function cleanMetadata(
  metadata: Record<string, any> | null | undefined
): Record<string, any> | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const cleaned: Record<string, any> = {};
  let hasValue = false;

  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
      hasValue = true;
    }
  }

  return hasValue ? cleaned : null;
}

/**
 * Audit Service for logging all administrative and security-relevant actions
 */
export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log an audit entry
   * @param req Express request (for IP, user-agent, user, tenant)
   * @param entry Audit log entry details
   */
  async log(req: Request, entry: AuditLogEntry): Promise<void> {
    try {
      const tenantContext = getTenantContext();
      const userId = req.user?.id || null;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get('user-agent') || null;

      // Create audit log entry asynchronously (don't block the request)
      setImmediate(async () => {
        try {
          const cleanedMetadata = cleanMetadata(entry.metadata);
          await this.prisma.auditLog.create({
            data: {
              tenantId: tenantContext.tenantId,
              userId,
              action: entry.action,
              entityType: entry.entityType,
              entityId: entry.entityId || null,
              before: entry.before || null,
              after: entry.after || null,
              ipAddress,
              userAgent,
              metadata: cleanedMetadata === null ? Prisma.DbNull : cleanedMetadata,
            },
          });

          if (process.env.NODE_ENV === 'development') {
            console.log(
              ` Audit: ${entry.action} by ${req.user?.email || 'system'} on ${entry.entityType}`
            );
          }
        } catch (error: any) {
          // Handle foreign key violations gracefully (e.g., user was deleted during demo reset)
          if (error.code === 'P2003') {
            console.warn(
              `[AUDIT] Skipping audit log for deleted user (userId: ${userId}, action: ${entry.action})`
            );
          } else {
            console.error('Failed to create audit log entry:', error);
          }
          // Don't throw - audit failure shouldn't break the main operation
        }
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      // Silently fail - audit failure shouldn't break the application
    }
  }

  /**
   * Get audit logs for the current tenant with optional filters
   */
  async getLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const where: any = { tenantId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    return logs;
  }

  /**
   * Get audit log count for a tenant with filters
   */
  async getCount(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<number> {
    const where: any = { tenantId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.auditLog.count({ where });
  }
}

/**
 * Singleton audit service instance
 */
export let auditService: AuditService;

/**
 * Initialize audit service with Prisma client
 */
export function initAuditService(prisma: PrismaClient) {
  auditService = new AuditService(prisma);
  if (process.env.NODE_ENV === 'development') {
    console.log('[OK] Audit service initialized');
  }
}
