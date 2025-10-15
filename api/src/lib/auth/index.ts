/**
 * Authentication Manager
 *
 * Coordinates all authentication strategies (demo, OAuth, SSO, mock)
 */

import type { Request, Response } from 'express';
import type { AuthUser, AuthMode } from './types.js';
import { PrismaClient } from '@prisma/client';
import { DemoAuthStrategy, getDemoModeConfig } from './demoMode.js';
import { OAuthStrategy, getOAuthConfig } from './oauth.js';

export * from './types.js';
export { DemoAuthStrategy, getDemoModeConfig } from './demoMode.js';
export { OAuthStrategy, getOAuthConfig } from './oauth.js';

export class AuthManager {
  private demoStrategy: DemoAuthStrategy | null = null;
  private oauthStrategy: OAuthStrategy | null = null;
  private enabledModes: Set<AuthMode>;

  constructor(private prisma: PrismaClient) {
    this.enabledModes = new Set<AuthMode>();

    // Demo mode can be enabled explicitly via AUTH_MODE_DEMO=true
    // Or automatically in development mode
    const isDemoEnabled =
      process.env.AUTH_MODE_DEMO === 'true' || process.env.NODE_ENV === 'development';

    if (isDemoEnabled) {
      const demoConfig = getDemoModeConfig();
      if (demoConfig.enabled) {
        this.demoStrategy = new DemoAuthStrategy(prisma, demoConfig);
        this.enabledModes.add('demo');
      }
    }

    // OAuth is enabled if credentials are provided
    // Optional in development, required in production
    const hasGitHub = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    if (hasGitHub || hasGoogle) {
      const oauthConfig = getOAuthConfig();
      this.oauthStrategy = new OAuthStrategy(prisma, oauthConfig);
      this.enabledModes.add('oauth');
    }

    // Log enabled auth modes
    console.log(`🔐 Auth modes enabled: ${Array.from(this.enabledModes).join(', ') || 'none'}`);
  }

  /**
   * Check if an auth mode is enabled
   */
  isModeEnabled(mode: AuthMode): boolean {
    return this.enabledModes.has(mode);
  }

  /**
   * Get list of enabled auth modes
   */
  getEnabledModes(): AuthMode[] {
    return Array.from(this.enabledModes);
  }

  /**
   * Authenticate with demo mode
   */
  async authenticateDemo(req: Request, res: Response): Promise<AuthUser | null> {
    if (!this.demoStrategy) {
      throw new Error('Demo mode is not enabled');
    }
    return this.demoStrategy.authenticate(req, res);
  }

  /**
   * Initiate GitHub OAuth
   */
  async initiateGitHub(req: Request, res: Response): Promise<void> {
    if (!this.oauthStrategy) {
      throw new Error('OAuth is not enabled');
    }
    return this.oauthStrategy.initiateGitHub(req, res);
  }

  /**
   * Handle GitHub callback
   */
  async handleGitHubCallback(req: Request, res: Response): Promise<AuthUser | null> {
    if (!this.oauthStrategy) {
      throw new Error('OAuth is not enabled');
    }
    return this.oauthStrategy.handleGitHubCallback(req, res);
  }

  /**
   * Initiate Google OAuth
   */
  async initiateGoogle(req: Request, res: Response): Promise<void> {
    if (!this.oauthStrategy) {
      throw new Error('OAuth is not enabled');
    }
    return this.oauthStrategy.initiateGoogle(req, res);
  }

  /**
   * Handle Google callback
   */
  async handleGoogleCallback(req: Request, res: Response): Promise<AuthUser | null> {
    if (!this.oauthStrategy) {
      throw new Error('OAuth is not enabled');
    }
    return this.oauthStrategy.handleGoogleCallback(req, res);
  }

  /**
   * Log out user
   */
  async logout(req: Request, _res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
