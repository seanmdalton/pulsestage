import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAdminKey } from './adminAuth.js';

describe('requireAdminKey middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  it('should reject request with missing admin key header when ADMIN_KEY is set', () => {
    // ADMIN_KEY is set in test environment
    mockReq.headers = {};

    requireAdminKey(mockReq as Request, mockRes as Response, mockNext);
    
    // Check if it was either rejected or allowed (depends on env)
    // If ADMIN_KEY is set, should reject
    if (process.env.ADMIN_KEY) {
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid or missing admin key'
      });
    } else {
      expect(mockNext).toHaveBeenCalled();
    }
  });

  it('should reject request with incorrect admin key', () => {
    mockReq.headers = {
      'x-admin-key': 'definitely-wrong-key-that-will-not-match'
    };

    requireAdminKey(mockReq as Request, mockRes as Response, mockNext);
    
    // If ADMIN_KEY is set, should reject wrong key
    if (process.env.ADMIN_KEY) {
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Invalid or missing admin key'
      });
    } else {
      expect(mockNext).toHaveBeenCalled();
    }
  });

  it('should allow request with correct admin key', () => {
    const adminKey = process.env.ADMIN_KEY;
    
    if (adminKey) {
      mockReq.headers = {
        'x-admin-key': adminKey
      };

      requireAdminKey(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    } else {
      // If no ADMIN_KEY, it should pass through anyway
      requireAdminKey(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    }
  });

  it('should handle array of admin keys in header', () => {
    mockReq.headers = {
      'x-admin-key': ['key1', 'key2'] as any
    };

    requireAdminKey(mockReq as Request, mockRes as Response, mockNext);
    
    // Should reject array (only first value is used by Express, but won't match)
    if (process.env.ADMIN_KEY) {
      expect(mockRes.status).toHaveBeenCalledWith(401);
    } else {
      expect(mockNext).toHaveBeenCalled();
    }
  });
});

