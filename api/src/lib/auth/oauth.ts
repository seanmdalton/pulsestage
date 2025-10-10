/**
 * OAuth Authentication (GitHub + Google)
 *
 * Implements OAuth 2.0 flows for GitHub and Google authentication.
 */

import type { Request, Response } from 'express';
import type { AuthUser, OAuthProfile } from './types.js';
import { PrismaClient } from '@prisma/client';

export interface OAuthConfig {
  github?: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
  google?: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
}

export function getOAuthConfig(): OAuthConfig {
  const config: OAuthConfig = {};

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    config.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
    };
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    config.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    };
  }

  return config;
}

export class OAuthStrategy {
  constructor(
    private prisma: PrismaClient,
    private config: OAuthConfig
  ) {}

  /**
   * Initiate GitHub OAuth flow
   */
  async initiateGitHub(req: Request, res: Response): Promise<void> {
    if (!this.config.github) {
      throw new Error('GitHub OAuth not configured');
    }

    const { clientId, callbackURL } = this.config.github;
    const state = this.generateState();

    // Store state in session for verification
    req.session.oauthState = state;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackURL,
      scope: 'read:user user:email',
      state,
    });

    const authURL = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.redirect(authURL);
  }

  /**
   * Handle GitHub OAuth callback
   */
  async handleGitHubCallback(req: Request, _res: Response): Promise<AuthUser | null> {
    if (!this.config.github) {
      throw new Error('GitHub OAuth not configured');
    }

    const { code, state } = req.query;

    // Verify state to prevent CSRF
    if (!state || state !== req.session.oauthState) {
      throw new Error('Invalid state parameter');
    }

    if (!code || typeof code !== 'string') {
      throw new Error('Missing authorization code');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.github.clientId,
        client_secret: this.config.github.clientSecret,
        code,
        redirect_uri: this.config.github.callbackURL,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const profile = await profileResponse.json();

    // Fetch user email (might be private)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const emails = await emailResponse.json();
    const primaryEmail = Array.isArray(emails)
      ? emails.find((e: any) => e.primary)?.email || emails[0]?.email
      : profile.email;

    if (!primaryEmail) {
      throw new Error('Unable to retrieve email from GitHub');
    }

    const oauthProfile: OAuthProfile = {
      id: profile.id.toString(),
      email: primaryEmail,
      name: profile.name || profile.login,
      avatar: profile.avatar_url,
      provider: 'github',
    };

    return this.createOrUpdateUser(oauthProfile, req);
  }

  /**
   * Initiate Google OAuth flow
   */
  async initiateGoogle(req: Request, res: Response): Promise<void> {
    if (!this.config.google) {
      throw new Error('Google OAuth not configured');
    }

    const { clientId, callbackURL } = this.config.google;
    const state = this.generateState();

    // Store state in session for verification
    req.session.oauthState = state;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackURL,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    const authURL = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(authURL);
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(req: Request, _res: Response): Promise<AuthUser | null> {
    if (!this.config.google) {
      throw new Error('Google OAuth not configured');
    }

    const { code, state } = req.query;

    // Verify state to prevent CSRF
    if (!state || state !== req.session.oauthState) {
      throw new Error('Invalid state parameter');
    }

    if (!code || typeof code !== 'string') {
      throw new Error('Missing authorization code');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.google.clientId,
        client_secret: this.config.google.clientSecret,
        code,
        redirect_uri: this.config.google.callbackURL,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`Google OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = await profileResponse.json();

    const oauthProfile: OAuthProfile = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      provider: 'google',
    };

    return this.createOrUpdateUser(oauthProfile, req);
  }

  /**
   * Create or update user from OAuth profile
   */
  private async createOrUpdateUser(profile: OAuthProfile, req: Request): Promise<AuthUser> {
    // Get tenant slug from session or use default
    const tenantSlug = req.session.tenantSlug || process.env.DEFAULT_TENANT_SLUG || 'default';

    // Find or create tenant
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          slug: tenantSlug,
          name: tenantSlug,
        },
      });
    }

    const ssoId = `${profile.provider}-${profile.id}`;

    // Find existing user by SSO ID or email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { ssoId, tenantId: tenant.id },
          { email: profile.email, tenantId: tenant.id },
        ],
      },
    });

    if (user) {
      // Update existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: profile.name,
          ssoId, // Update SSO ID if it changed
        },
      });
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          ssoId,
          tenantId: tenant.id,
        },
      });

      // Create user preferences
      await this.prisma.userPreferences.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          favoriteTeams: [],
          emailNotifications: true,
        },
      });

      // Auto-add to default team
      const defaultTeam = await this.prisma.team.findFirst({
        where: { tenantId: tenant.id },
      });

      if (defaultTeam) {
        await this.prisma.teamMembership.create({
          data: {
            userId: user.id,
            teamId: defaultTeam.id,
            role: 'member',
          },
        });
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email, // Fallback to email if name is null
      ssoId: user.ssoId ?? undefined,
      provider: profile.provider,
    };
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
