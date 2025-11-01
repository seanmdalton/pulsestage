import { Request, Response, NextFunction } from 'express';

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  console.log(' Admin session check:', {
    hasSession: !!req.session,
    sessionId: req.sessionID,
    isAdmin: req.session?.isAdmin,
    loginTime: req.session?.loginTime,
    path: req.path,
    method: req.method,
  });

  if (!req.session?.isAdmin) {
    console.log('[ERROR] Admin session rejected: no admin session');
    return res.status(401).json({
      error: 'Admin authentication required',
      loginRequired: true,
    });
  }

  // Check session age (optional additional security)
  const loginTime = req.session.loginTime;
  if (loginTime && Date.now() - loginTime > 8 * 60 * 60 * 1000) {
    // 8 hours max
    console.log('[ERROR] Admin session expired');
    req.session.destroy(err => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(401).json({
      error: 'Session expired',
      loginRequired: true,
    });
  }

  console.log('[OK] Admin session valid');
  next();
}
