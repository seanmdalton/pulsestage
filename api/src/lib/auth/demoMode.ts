/**
 * Demo Mode Authentication
 *
 * Provides instant auto-login for demo users without passwords.
 * Useful for trials, testing, and demos.
 *
 * Usage: /auth/demo?user=alice
 */

import type { Request, Response } from 'express';
import type { AuthUser } from './types.js';
import { PrismaClient } from '@prisma/client';
import { getOrCreateGeneralTeam } from '../teams.js';
import { getEmailService } from '../email/index.js';
import { renderWelcomeEmail } from '../email/templates.js';

// Default demo users (can be overridden by DEMO_USERS env var)
const DEFAULT_DEMO_USERS = ['alice', 'bob', 'moderator', 'admin'];

export interface DemoModeConfig {
  enabled: boolean;
  users: string[];
}

export function getDemoModeConfig(): DemoModeConfig {
  const authModes = (process.env.AUTH_MODE || 'demo').split(',').map(m => m.trim());
  const enabled = authModes.includes('demo');

  const users = process.env.DEMO_USERS
    ? process.env.DEMO_USERS.split(',').map(u => u.trim())
    : DEFAULT_DEMO_USERS;

  return { enabled, users };
}

export class DemoAuthStrategy {
  constructor(
    private prisma: PrismaClient,
    private config: DemoModeConfig
  ) {}

  /**
   * Authenticate a demo user
   * Creates user if doesn't exist, auto-assigns roles
   */
  async authenticate(req: Request, _res: Response): Promise<AuthUser | null> {
    if (!this.config.enabled) {
      return null;
    }

    const username = req.query.user as string;
    if (!username) {
      return null;
    }

    // Validate username is in allowed list
    if (!this.config.users.includes(username.toLowerCase())) {
      return null;
    }

    // Get or create demo user
    const tenantSlug = (req.query.tenant as string) || 'demo';

    // Find or create tenant
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          slug: tenantSlug,
          name: `Demo: ${tenantSlug}`,
        },
      });
    }

    // Demo user email format: username@pulsestage.app
    const email = `${username}@pulsestage.app`;
    // Use simple username as SSO ID to match seed data
    const ssoId = username;

    let user = await this.prisma.user.findFirst({
      where: { email, tenantId: tenant.id },
    });

    if (!user) {
      // Get or create General team for new user
      const generalTeam = await getOrCreateGeneralTeam(this.prisma, tenant.id);

      user = await this.prisma.user.create({
        data: {
          email,
          name: this.getDemoUserDisplayName(username),
          ssoId,
          tenantId: tenant.id,
          primaryTeamId: generalTeam.id, // Assign to General team initially
        },
      });

      // Create user preferences
      await this.prisma.userPreferences.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          favoriteTeams: [],
          emailNotifications: false, // Disable for demo users
        },
      });

      // Auto-assign role based on username
      await this.assignDemoRole(user.id, tenant.id, username);

      // Send welcome email (async, don't await)
      this.sendWelcomeEmail(user, tenant, generalTeam).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email, // Fallback to email if name is null
      ssoId: user.ssoId ?? undefined,
      provider: 'demo',
    };
  }

  /**
   * Send welcome email to new user
   */
  private async sendWelcomeEmail(
    user: { id: string; email: string; name: string | null },
    tenant: { slug: string; name: string | null },
    homeTeam: { slug: string; name: string }
  ): Promise<void> {
    try {
      const emailService = getEmailService();
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const dashboardUrl = `${baseUrl}/${homeTeam.slug}/dashboard`;

      const html = await renderWelcomeEmail({
        userName: user.name || user.email,
        tenantName: tenant.name || tenant.slug,
        homeTeamName: homeTeam.name,
        dashboardUrl,
      });

      await emailService.send({
        to: { email: user.email, name: user.name || user.email },
        subject: `Welcome to ${tenant.name || tenant.slug}!`,
        html,
      });

      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      // Log but don't throw - welcome email failure shouldn't block authentication
      console.error('Error sending welcome email:', error);
    }
  }

  /**
   * Get display name for demo user
   */
  private getDemoUserDisplayName(username: string): string {
    const nameMap: Record<string, string> = {
      alice: 'Alice (Demo)',
      bob: 'Bob (Demo)',
      moderator: 'Demo Moderator',
      admin: 'Demo Admin',
    };

    return nameMap[username.toLowerCase()] || `${username} (Demo)`;
  }

  /**
   * Auto-assign role to demo user
   */
  private async assignDemoRole(userId: string, tenantId: string, username: string): Promise<void> {
    // Find or create default team
    let team = await this.prisma.team.findFirst({
      where: { tenantId, slug: 'general' },
    });

    if (!team) {
      team = await this.prisma.team.create({
        data: {
          tenantId,
          name: 'General',
          slug: 'general',
          description: 'Default team for all users',
        },
      });
    }

    // Assign role based on username
    let role = 'member';
    if (username.toLowerCase() === 'admin') {
      role = 'admin';
    } else if (username.toLowerCase() === 'moderator') {
      role = 'moderator';
    }

    await this.prisma.teamMembership.create({
      data: {
        userId,
        teamId: team.id,
        role,
      },
    });
  }
}
