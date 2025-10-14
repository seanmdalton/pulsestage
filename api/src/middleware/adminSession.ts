import { Request, Response, NextFunction } from 'express';

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development') {
    // Debug logging only in development
    console.log('🔒 Admin session check:', {
      hasSession: !!req.session,
      isAdmin: req.session?.isAdmin,
      loginTime: req.session?.loginTime,
      path: req.path,
      method: req.method,
    });
  }

  if (!req.session?.isAdmin) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Admin session rejected: no admin session');
    }
    return res.status(401).json({
      error: 'Admin authentication required',
      loginRequired: true,
    });
  }

  // Check session age (8 hours max)
  const loginTime = req.session.loginTime;
  if (loginTime && Date.now() - loginTime > 8 * 60 * 60 * 1000) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Admin session expired');
    }
    req.session.destroy(err => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(401).json({
      error: 'Session expired',
      loginRequired: true,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Admin session valid');
  }
  next();
}
