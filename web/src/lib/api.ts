import { z } from 'zod';
import type { components, operations } from './api-types';

// Re-export OpenAPI-generated types
export type Question = components['schemas']['Question'];
export type CreateQuestionRequest = components['schemas']['CreateQuestionRequest'];
export type RespondRequest = components['schemas']['RespondRequest'];
export type HealthResponse = components['schemas']['HealthResponse'];

// Team types (manual until we update OpenAPI spec)
export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
  };
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionTag {
  id: string;
  questionId: string;
  tagId: string;
  createdAt: string;
  tag: Tag;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  ssoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMembership {
  id: string;
  userId: string;
  teamId: string;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  createdAt: string;
  user?: User;
  team?: Team;
}

export interface UserPreferences {
  id: string;
  userId: string;
  favoriteTeams: string[]; // Array of team slugs
  defaultTeamId?: string;
  createdAt: string;
  updatedAt: string;
  defaultTeam?: Team;
}

// Enhanced team type with user context
export interface TeamWithMembership extends Team {
  userRole?: 'member' | 'moderator' | 'admin' | 'owner';
  isFavorite?: boolean;
  memberCount?: number;
  members?: TeamMembership[];
}

// User management request types
export interface CreateUserRequest {
  email: string;
  name?: string;
  ssoId?: string;
}

export interface UpdateUserPreferencesRequest {
  favoriteTeams?: string[];
  defaultTeamId?: string;
}

export interface AddTeamMemberRequest {
  userId: string;
  role?: 'member' | 'moderator' | 'admin' | 'owner';
}

export interface UpdateTeamMemberRequest {
  role: 'member' | 'moderator' | 'admin' | 'owner';
}

// User context response types
export interface UserContext {
  user: User;
  teams: TeamWithMembership[];
  preferences: UserPreferences;
}

export interface UserTeamsResponse {
  teams: TeamWithMembership[];
  favorites: string[];
  defaultTeam?: Team;
}

export interface ExportFilters {
  teamId?: string;
  status?: 'open' | 'answered' | 'both';
  startDate?: string;
  endDate?: string;
  minUpvotes?: number;
  maxUpvotes?: number;
  tagIds?: string[];
  hasResponse?: 'true' | 'false';
  limit?: number;
}

export interface ExportPreview {
  count: number;
  preview: Question[];
  filters: ExportFilters;
}

export interface CreateTeamRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Zod schemas for runtime validation (kept for validation purposes)
const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    questions: z.number()
  }).optional()
});

const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const QuestionTagSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  tagId: z.string(),
  createdAt: z.string(),
  tag: TagSchema,
});

const QuestionSchema = z.object({
  id: z.string(),
  body: z.string(),
  upvotes: z.number(),
  status: z.enum(['OPEN', 'ANSWERED']),
  responseText: z.string().nullable(),
  respondedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  teamId: z.string().nullable(),
  team: TeamSchema.nullable().optional(),
  tags: z.array(QuestionTagSchema).optional()
});

const CreateQuestionSchema = z.object({
  body: z.string().min(3).max(2000),
  teamId: z.string().optional()
});

const RespondSchema = z.object({
  response: z.string().min(1).max(10000),
});

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  description: z.string().max(500).optional()
});

const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional()
});

const HealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
});

const ExportPreviewSchema = z.object({
  count: z.number(),
  preview: z.array(QuestionSchema),
  filters: z.object({}).passthrough()
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
      // Add mock SSO and tenant headers for local development
      const mockSSOUser = localStorage.getItem('mock-sso-user');
      const mockTenant = localStorage.getItem('mock-tenant');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (mockSSOUser) {
        headers['x-mock-sso-user'] = mockSSOUser;
      }
      
      // Add tenant header - defaults to 'default' if not set
      headers['x-tenant-id'] = mockTenant || 'default';
    
    const response = await fetch(url, {
      headers,
      credentials: 'include', // Always include credentials for session cookies
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return schema.parse(data);
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request('/health', {}, HealthSchema);
  }

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    return this.request('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    }, QuestionSchema);
  }

  async getQuestions(status?: 'OPEN' | 'ANSWERED', teamId?: string): Promise<Question[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status.toLowerCase());
    if (teamId) params.append('teamId', teamId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/questions${queryString}`, {}, z.array(QuestionSchema));
  }

  async upvoteQuestion(id: string): Promise<Question> {
    return this.request(`/questions/${id}/upvote`, {
      method: 'POST',
    }, QuestionSchema);
  }

  async getUpvoteStatus(id: string): Promise<{ hasUpvoted: boolean; canUpvote: boolean }> {
    return this.request(`/questions/${id}/upvote-status`, {
      method: 'GET',
    }, z.object({
      hasUpvoted: z.boolean(),
      canUpvote: z.boolean()
    }));
  }

  async respondToQuestion(id: string, data: RespondRequest, adminKey: string): Promise<Question> {
    return this.request(`/questions/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'x-admin-key': adminKey,
      },
    }, QuestionSchema);
  }

  async searchQuestions(query: string, teamId?: string): Promise<Question[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const params = new URLSearchParams();
    params.append('q', query.trim());
    if (teamId) params.append('teamId', teamId);
    return this.request(`/questions/search?${params.toString()}`, {}, z.array(QuestionSchema));
  }

  // Admin authentication methods
  async adminLogin(adminKey: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const AdminLoginResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
      expiresIn: z.number()
    });

    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ adminKey }),
      credentials: 'include' // Important for session cookies
    }, AdminLoginResponseSchema);
  }

  async adminLogout(): Promise<{ success: boolean; message: string }> {
    const AdminLogoutResponseSchema = z.object({
      success: z.boolean(),
      message: z.string()
    });

    return this.request('/admin/logout', {
      method: 'POST',
      credentials: 'include'
    }, AdminLogoutResponseSchema);
  }

  async getAdminStatus(): Promise<{ isAuthenticated: boolean; loginTime: number | null; sessionAge: number | null }> {
    const AdminStatusSchema = z.object({
      isAuthenticated: z.boolean(),
      loginTime: z.number().nullable(),
      sessionAge: z.number().nullable()
    });

    return this.request('/admin/status', {
      credentials: 'include'
    }, AdminStatusSchema);
  }

  // Updated respond method that uses session auth instead of admin key
  async respondToQuestionWithSession(id: string, data: RespondRequest): Promise<Question> {
    return this.request(`/questions/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include' // Use session instead of admin key header
    }, QuestionSchema);
  }

  // Team management methods
  async getTeams(): Promise<Team[]> {
    return this.request('/teams', {}, z.array(TeamSchema));
  }

  async getTeamBySlug(slug: string): Promise<Team> {
    return this.request(`/teams/${slug}`, {}, TeamSchema);
  }

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include'
    }, TeamSchema);
  }

  async updateTeam(id: string, data: UpdateTeamRequest): Promise<Team> {
    return this.request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      credentials: 'include'
    }, TeamSchema);
  }

  async deleteTeam(id: string): Promise<{ success: boolean; message: string }> {
    const DeleteTeamResponseSchema = z.object({
      success: z.boolean(),
      message: z.string()
    });

    return this.request(`/teams/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }, DeleteTeamResponseSchema);
  }

  // Tag management methods
  async getTags(): Promise<Tag[]> {
    return this.request('/tags', {}, z.array(TagSchema));
  }

  async createTag(data: CreateTagRequest): Promise<Tag> {
    const CreateTagSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
    });

    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include'
    }, TagSchema);
  }

  async addTagToQuestion(questionId: string, tagId: string): Promise<{ success: boolean }> {
    const AddTagResponseSchema = z.object({
      success: z.boolean()
    });

    return this.request(`/questions/${questionId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
      credentials: 'include'
    }, AddTagResponseSchema);
  }

  async removeTagFromQuestion(questionId: string, tagId: string): Promise<{ success: boolean }> {
    const RemoveTagResponseSchema = z.object({
      success: z.boolean()
    });

    return this.request(`/questions/${questionId}/tags/${tagId}`, {
      method: 'DELETE',
      credentials: 'include'
    }, RemoveTagResponseSchema);
  }

  // Export methods
  async getExportPreview(filters: ExportFilters): Promise<ExportPreview> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    return this.request(`/admin/export/preview?${queryParams}`, {
      credentials: 'include'
    }, ExportPreviewSchema);
  }

  async downloadExport(filters: ExportFilters, format: 'csv' | 'json'): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    queryParams.append('format', format);

    // Get the mock SSO user and tenant headers from localStorage
    const mockSSOUser = localStorage.getItem('mock-sso-user');
    const mockTenant = localStorage.getItem('mock-tenant');
    
    const response = await fetch(`${this.baseUrl}/admin/export/download?${queryParams}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(mockSSOUser && { 'x-mock-sso-user': mockSSOUser }),
        'x-tenant-id': mockTenant || 'default'
      }
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  // User management methods
  async getCurrentUser(): Promise<User> {
    const UserSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      ssoId: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string()
    });

    return this.request('/users/me', {
      credentials: 'include'
    }, UserSchema);
  }

  async updateUserPreferences(data: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    const UpdateUserPreferencesSchema = z.object({
      favoriteTeams: z.array(z.string()).optional(),
      defaultTeamId: z.string().optional()
    });

    const UserPreferencesSchema = z.object({
      id: z.string(),
      userId: z.string(),
      favoriteTeams: z.array(z.string()),
      defaultTeamId: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      defaultTeam: TeamSchema.optional()
    });

    return this.request('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
      credentials: 'include'
    }, UserPreferencesSchema);
  }

  async getUserTeams(): Promise<UserTeamsResponse> {
    const TeamWithMembershipSchema = TeamSchema.extend({
      userRole: z.enum(['member', 'moderator', 'admin', 'owner']).optional(),
      isFavorite: z.boolean().optional(),
      memberCount: z.number().optional(),
      members: z.array(z.object({
        id: z.string(),
        userId: z.string(),
        teamId: z.string(),
        role: z.enum(['member', 'moderator', 'admin', 'owner']),
        createdAt: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string().email(),
          name: z.string().optional()
        }).optional()
      })).optional()
    });

    const UserTeamsResponseSchema = z.object({
      teams: z.array(TeamWithMembershipSchema),
      favorites: z.array(z.string()),
      defaultTeam: TeamSchema.nullable()
    });

    return this.request('/users/me/teams', {
      credentials: 'include'
    }, UserTeamsResponseSchema);
  }

  async toggleTeamFavorite(teamId: string): Promise<{ isFavorite: boolean }> {
    const ToggleFavoriteResponseSchema = z.object({
      isFavorite: z.boolean()
    });

    return this.request(`/users/me/teams/${teamId}/favorite`, {
      method: 'POST',
      credentials: 'include'
    }, ToggleFavoriteResponseSchema);
  }

  async getUserQuestions(): Promise<Question[]> {
    const QuestionSchema = z.object({
      id: z.string(),
      body: z.string(),
      upvotes: z.number(),
      status: z.enum(['OPEN', 'ANSWERED']),
      responseText: z.string().nullable().optional(),
      respondedAt: z.string().nullable().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      teamId: z.string().optional(),
      authorId: z.string().optional(),
      team: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        isActive: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string()
      }).optional(),
      author: z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
        ssoId: z.string().optional(),
        createdAt: z.string(),
        updatedAt: z.string()
      }).optional(),
      tags: z.array(z.object({
        id: z.string(),
        questionId: z.string(),
        tagId: z.string(),
        createdAt: z.string(),
        tag: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          color: z.string(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
      })).optional()
    });

    return this.request('/users/me/questions', {
      credentials: 'include'
    }, z.array(QuestionSchema));
  }

  // Team membership management (admin only)
  async getTeamMembers(teamId: string): Promise<TeamMembership[]> {
    const TeamMembershipSchema = z.object({
      id: z.string(),
      userId: z.string(),
      teamId: z.string(),
      role: z.enum(['member', 'moderator', 'admin', 'owner']),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional()
      }).optional()
    });

    return this.request(`/teams/${teamId}/members`, {
      credentials: 'include'
    }, z.array(TeamMembershipSchema));
  }

  async addTeamMember(teamId: string, data: AddTeamMemberRequest): Promise<TeamMembership> {
    const AddTeamMemberSchema = z.object({
      userId: z.string(),
      role: z.enum(['member', 'moderator', 'admin', 'owner']).optional()
    });

    const TeamMembershipSchema = z.object({
      id: z.string(),
      userId: z.string(),
      teamId: z.string(),
      role: z.enum(['member', 'moderator', 'admin', 'owner']),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional()
      }).optional()
    });

    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include'
    }, TeamMembershipSchema);
  }

  async updateTeamMember(teamId: string, userId: string, data: UpdateTeamMemberRequest): Promise<TeamMembership> {
    const UpdateTeamMemberSchema = z.object({
      role: z.enum(['member', 'moderator', 'admin', 'owner'])
    });

    const TeamMembershipSchema = z.object({
      id: z.string(),
      userId: z.string(),
      teamId: z.string(),
      role: z.enum(['member', 'moderator', 'admin', 'owner']),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional()
      }).optional()
    });

    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      credentials: 'include'
    }, TeamMembershipSchema);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<{ success: boolean }> {
    const RemoveMemberResponseSchema = z.object({
      success: z.boolean()
    });

    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    }, RemoveMemberResponseSchema);
  }
}

export const apiClient = new ApiClient();

// Default export for easier importing
export default apiClient;
