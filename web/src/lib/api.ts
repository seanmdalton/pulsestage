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
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

    const response = await fetch(`${this.baseUrl}/admin/export/download?${queryParams}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();

// Default export for easier importing
export default apiClient;
