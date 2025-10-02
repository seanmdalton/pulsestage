import { Request, Response, NextFunction } from 'express';

export function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ 
      error: 'Admin authentication required',
      loginRequired: true 
    });
  }
  
  // Check session age (optional additional security)
  const loginTime = req.session.loginTime;
  if (loginTime && Date.now() - loginTime > 8 * 60 * 60 * 1000) { // 8 hours max
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(401).json({ 
      error: 'Session expired',
      loginRequired: true 
    });
  }
  
  next();
}
