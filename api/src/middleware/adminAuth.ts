import { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  // In production, fail closed if admin key is not configured
  if (!env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized: Admin key not configured' });
  }

  const providedKey = req.headers['x-admin-key'];

  if (!providedKey || providedKey !== env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin key' });
  }

  next();
}
