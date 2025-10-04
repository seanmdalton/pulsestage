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

/**
 * RBAC Permission System
 * 
 * Defines roles, permissions, and access control logic for the application.
 * 
 * Roles (in order of privilege):
 * - viewer: Anonymous/unauthenticated users
 * - member: Authenticated users who can submit and upvote
 * - moderator: Can answer questions and moderate content
 * - admin: Full team/tag management and data access
 * - owner: User management + all admin powers
 */

export type Role = 'viewer' | 'member' | 'moderator' | 'admin' | 'owner';

export type Permission = 
  // Questions
  | 'question.view'
  | 'question.submit'
  | 'question.upvote'
  | 'question.answer'
  | 'question.tag'
  | 'question.pin'
  | 'question.delete'
  // Tags
  | 'tag.view'
  | 'tag.create'
  | 'tag.edit'
  | 'tag.delete'
  // Teams
  | 'team.view.own'     // View teams user is member of
  | 'team.view.all'     // View all teams in tenant
  | 'team.create'
  | 'team.edit'
  | 'team.delete'
  // Members
  | 'member.view.own'   // View members of own teams
  | 'member.view.all'   // View all members in tenant
  | 'member.add'
  | 'member.edit'
  | 'member.remove'
  // Admin
  | 'admin.access'      // Access admin panel
  | 'audit.view'        // View audit logs
  | 'data.export'       // Export data
  | 'presentation.access'; // Access presentation mode

/**
 * Permission matrix defining which roles have which permissions
 */
const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  viewer: new Set([
    'question.view',
    'question.upvote',
    'tag.view',
    'team.view.own',
    'member.view.own'
  ]),
  
  member: new Set([
    'question.view',
    'question.submit',
    'question.upvote',
    'tag.view',
    'team.view.own',
    'member.view.own'
  ]),
  
  moderator: new Set([
    'question.view',
    'question.submit',
    'question.upvote',
    'question.answer',
    'question.tag',
    'question.pin',
    'tag.view',
    'tag.create',
    'team.view.own',
    'member.view.own',
    'admin.access',
    'presentation.access'
  ]),
  
  admin: new Set([
    'question.view',
    'question.submit',
    'question.upvote',
    'question.answer',
    'question.tag',
    'question.pin',
    'question.delete',
    'tag.view',
    'tag.create',
    'tag.edit',
    'tag.delete',
    'team.view.all',
    'team.create',
    'team.edit',
    'team.delete',
    'member.view.all',
    'member.add',
    'admin.access',
    'audit.view',
    'data.export',
    'presentation.access'
  ]),
  
  owner: new Set([
    // Owner has all permissions
    'question.view',
    'question.submit',
    'question.upvote',
    'question.answer',
    'question.tag',
    'question.pin',
    'question.delete',
    'tag.view',
    'tag.create',
    'tag.edit',
    'tag.delete',
    'team.view.all',
    'team.create',
    'team.edit',
    'team.delete',
    'member.view.all',
    'member.add',
    'member.edit',
    'member.remove',
    'admin.access',
    'audit.view',
    'data.export',
    'presentation.access'
  ])
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Set<Permission> {
  return ROLE_PERMISSIONS[role] || new Set();
}

/**
 * Check if a role has any of the specified permissions (OR logic)
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions (AND logic)
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get the highest role from a list of team memberships
 * Hierarchy: owner > admin > moderator > member > viewer
 */
export function getHighestRole(roles: string[]): Role {
  const roleHierarchy: Record<string, number> = {
    owner: 5,
    admin: 4,
    moderator: 3,
    member: 2,
    viewer: 1
  };
  
  let highestRole: Role = 'viewer';
  let highestLevel = 0;
  
  for (const role of roles) {
    const level = roleHierarchy[role] || 0;
    if (level > highestLevel) {
      highestLevel = level;
      highestRole = role as Role;
    }
  }
  
  return highestRole;
}

/**
 * Check if a role is at least a certain level
 * Useful for "admin or higher" type checks
 */
export function isRoleAtLeast(role: Role, minimumRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    viewer: 1,
    member: 2,
    moderator: 3,
    admin: 4,
    owner: 5
  };
  
  return roleHierarchy[role] >= roleHierarchy[minimumRole];
}

/**
 * Validate that a string is a valid role
 */
export function isValidRole(role: string): role is Role {
  return ['viewer', 'member', 'moderator', 'admin', 'owner'].includes(role);
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: Role): string {
  const roleNames: Record<Role, string> = {
    viewer: 'Viewer',
    member: 'Member',
    moderator: 'Moderator',
    admin: 'Admin',
    owner: 'Owner'
  };
  
  return roleNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    viewer: 'Can view and upvote questions',
    member: 'Can submit and upvote questions',
    moderator: 'Can answer questions and moderate content',
    admin: 'Full team and content management',
    owner: 'Full access including user management'
  };
  
  return descriptions[role];
}

