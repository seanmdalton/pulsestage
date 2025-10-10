/**
 * Authentication type definitions
 */

export type AuthMode = 'demo' | 'oauth' | 'sso' | 'mock';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  ssoId?: string;
  provider?: 'demo' | 'github' | 'google' | 'mock';
}

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'github' | 'google';
}

export interface AuthConfig {
  modes: AuthMode[];
  demoUsers?: string[];
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

export interface AuthStrategy {
  name: string;
  authenticate(req: any, res: any): Promise<AuthUser | null>;
}
