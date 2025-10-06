import { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  if (!env.ADMIN_KEY) {
    // If no admin key is set, allow access (for development)
    return next();
  }

  const providedKey = req.headers['x-admin-key'];

  if (!providedKey || providedKey !== env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin key' });
  }

  next();
}
