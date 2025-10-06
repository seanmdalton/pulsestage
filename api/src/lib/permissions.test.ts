/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getHighestRole,
  isRoleAtLeast,
  isValidRole,
  getRoleName,
  getRoleDescription,
  type Permission,
} from './permissions.js';

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('viewer can view questions', () => {
      expect(hasPermission('viewer', 'question.view')).toBe(true);
    });

    it('viewer cannot submit questions', () => {
      expect(hasPermission('viewer', 'question.submit')).toBe(false);
    });

    it('member can submit questions', () => {
      expect(hasPermission('member', 'question.submit')).toBe(true);
    });

    it('member cannot answer questions', () => {
      expect(hasPermission('member', 'question.answer')).toBe(false);
    });

    it('moderator can answer questions', () => {
      expect(hasPermission('moderator', 'question.answer')).toBe(true);
    });

    it('moderator can access admin panel', () => {
      expect(hasPermission('moderator', 'admin.access')).toBe(true);
    });

    it('moderator cannot view audit log', () => {
      expect(hasPermission('moderator', 'audit.view')).toBe(false);
    });

    it('moderator cannot create teams', () => {
      expect(hasPermission('moderator', 'team.create')).toBe(false);
    });

    it('admin can view audit log', () => {
      expect(hasPermission('admin', 'audit.view')).toBe(true);
    });

    it('admin can create teams', () => {
      expect(hasPermission('admin', 'team.create')).toBe(true);
    });

    it('admin cannot edit members', () => {
      expect(hasPermission('admin', 'member.edit')).toBe(false);
    });

    it('owner can edit members', () => {
      expect(hasPermission('owner', 'member.edit')).toBe(true);
    });

    it('owner has all permissions', () => {
      const allPermissions: Permission[] = [
        'question.answer',
        'team.create',
        'member.edit',
        'audit.view',
        'data.export',
      ];
      allPermissions.forEach(permission => {
        expect(hasPermission('owner', permission)).toBe(true);
      });
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true if role has at least one permission', () => {
      expect(hasAnyPermission('member', ['question.submit', 'team.create'])).toBe(true);
    });

    it('returns false if role has none of the permissions', () => {
      expect(hasAnyPermission('member', ['team.create', 'audit.view'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true if role has all permissions', () => {
      expect(hasAllPermissions('moderator', ['question.answer', 'question.tag'])).toBe(true);
    });

    it('returns false if role is missing any permission', () => {
      expect(hasAllPermissions('moderator', ['question.answer', 'team.create'])).toBe(false);
    });
  });

  describe('getHighestRole', () => {
    it('returns owner when present', () => {
      expect(getHighestRole(['member', 'admin', 'owner'])).toBe('owner');
    });

    it('returns admin when no owner', () => {
      expect(getHighestRole(['member', 'moderator', 'admin'])).toBe('admin');
    });

    it('returns moderator when no admin', () => {
      expect(getHighestRole(['member', 'moderator'])).toBe('moderator');
    });

    it('returns member when no moderator', () => {
      expect(getHighestRole(['member'])).toBe('member');
    });

    it('returns viewer for empty array', () => {
      expect(getHighestRole([])).toBe('viewer');
    });

    it('handles single role', () => {
      expect(getHighestRole(['moderator'])).toBe('moderator');
    });
  });

  describe('isRoleAtLeast', () => {
    it('owner is at least admin', () => {
      expect(isRoleAtLeast('owner', 'admin')).toBe(true);
    });

    it('admin is at least moderator', () => {
      expect(isRoleAtLeast('admin', 'moderator')).toBe(true);
    });

    it('moderator is at least member', () => {
      expect(isRoleAtLeast('moderator', 'member')).toBe(true);
    });

    it('member is not at least admin', () => {
      expect(isRoleAtLeast('member', 'admin')).toBe(false);
    });

    it('role equals minimum returns true', () => {
      expect(isRoleAtLeast('admin', 'admin')).toBe(true);
    });

    it('viewer is not at least member', () => {
      expect(isRoleAtLeast('viewer', 'member')).toBe(false);
    });
  });

  describe('isValidRole', () => {
    it('validates correct role strings', () => {
      expect(isValidRole('viewer')).toBe(true);
      expect(isValidRole('member')).toBe(true);
      expect(isValidRole('moderator')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('owner')).toBe(true);
    });

    it('rejects invalid role strings', () => {
      expect(isValidRole('superuser')).toBe(false);
      expect(isValidRole('guest')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole('ADMIN')).toBe(false);
    });
  });

  describe('getRoleName', () => {
    it('returns user-friendly role names', () => {
      expect(getRoleName('viewer')).toBe('Viewer');
      expect(getRoleName('member')).toBe('Member');
      expect(getRoleName('moderator')).toBe('Moderator');
      expect(getRoleName('admin')).toBe('Admin');
      expect(getRoleName('owner')).toBe('Owner');
    });
  });

  describe('getRoleDescription', () => {
    it('returns role descriptions', () => {
      expect(getRoleDescription('viewer')).toBeTruthy();
      expect(getRoleDescription('member')).toContain('submit');
      expect(getRoleDescription('moderator')).toContain('answer');
      expect(getRoleDescription('admin')).toContain('management');
      expect(getRoleDescription('owner')).toContain('Full access');
    });
  });

  describe('Permission Matrix Validation', () => {
    it('viewer has minimal permissions', () => {
      expect(hasPermission('viewer', 'question.view')).toBe(true);
      expect(hasPermission('viewer', 'question.submit')).toBe(false);
      expect(hasPermission('viewer', 'admin.access')).toBe(false);
    });

    it('member can participate but not moderate', () => {
      expect(hasPermission('member', 'question.submit')).toBe(true);
      expect(hasPermission('member', 'question.upvote')).toBe(true);
      expect(hasPermission('member', 'question.answer')).toBe(false);
      expect(hasPermission('member', 'admin.access')).toBe(false);
    });

    it('moderator can moderate but not manage', () => {
      expect(hasPermission('moderator', 'question.answer')).toBe(true);
      expect(hasPermission('moderator', 'question.tag')).toBe(true);
      expect(hasPermission('moderator', 'admin.access')).toBe(true);
      expect(hasPermission('moderator', 'team.create')).toBe(false);
      expect(hasPermission('moderator', 'audit.view')).toBe(false);
    });

    it('admin can manage everything except users', () => {
      expect(hasPermission('admin', 'team.create')).toBe(true);
      expect(hasPermission('admin', 'audit.view')).toBe(true);
      expect(hasPermission('admin', 'data.export')).toBe(true);
      expect(hasPermission('admin', 'member.edit')).toBe(false);
      expect(hasPermission('admin', 'member.remove')).toBe(false);
    });

    it('owner has complete access', () => {
      expect(hasPermission('owner', 'member.edit')).toBe(true);
      expect(hasPermission('owner', 'member.remove')).toBe(true);
      expect(hasPermission('owner', 'audit.view')).toBe(true);
    });
  });
});
