import { z } from 'zod'
import type { components } from './api-types'

// Re-export OpenAPI-generated types
export type Question = components['schemas']['Question']
// Override CreateQuestionRequest to include teamId (OpenAPI spec has it but types are out of sync)
export interface CreateQuestionRequest {
  body: string
  teamId?: string
}
export type RespondRequest = components['schemas']['RespondRequest']
export type HealthResponse = components['schemas']['HealthResponse']

// Team types (manual until we update OpenAPI spec)
export interface Team {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    questions: number
  }
}

// Tag types
export interface Tag {
  id: string
  name: string
  description?: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export interface QuestionTag {
  id: string
  questionId: string
  tagId: string
  createdAt: string
  tag: Tag
}

export interface CreateTagRequest {
  name: string
  description?: string | null
  color?: string
}

// User types
export interface User {
  id: string
  email: string
  name?: string
  ssoId?: string
  createdAt: string
  updatedAt: string
}

export interface TeamMembership {
  id: string
  userId: string
  teamId: string
  role: 'member' | 'moderator' | 'admin' | 'owner'
  createdAt: string
  user?: User
  team?: Team
}

export interface UserPreferences {
  id: string
  userId: string
  favoriteTeams: string[] // Array of team slugs
  defaultTeamId?: string
  createdAt: string
  updatedAt: string
  defaultTeam?: Team
}

// Enhanced team type with user context
export interface TeamWithMembership extends Team {
  userRole?: 'member' | 'moderator' | 'admin' | 'owner'
  isFavorite?: boolean
  memberCount?: number
  members?: TeamMembership[]
}

// Tenant Settings type (matches backend DEFAULT_SETTINGS)
export interface TenantSettingsType {
  questions: {
    minLength: number
    maxLength: number
  }
  users: {
    defaultRole: 'viewer' | 'member' | 'moderator' | 'admin' | 'owner'
  }
  security: {
    sessionTimeout: number
    adminSessionTimeout: number
    rateLimits: {
      questionsPerHour: number
      upvotesPerMinute: number
      responsesPerHour: number
      searchPerMinute: number
    }
  }
  branding: {
    primaryColor: string
    accentColor: string
    logoUrl: string | null
    faviconUrl: string | null
  }
  features: {
    allowAnonymousQuestions: boolean
    requireQuestionApproval: boolean
    enableEmailNotifications: boolean
  }
}

// User management request types
export interface CreateUserRequest {
  email: string
  name?: string
  ssoId?: string
}

export interface UpdateUserPreferencesRequest {
  favoriteTeams?: string[]
  defaultTeamId?: string
}

export interface AddTeamMemberRequest {
  userId: string
  role?: 'member' | 'moderator' | 'admin' | 'owner'
}

export interface UpdateTeamMemberRequest {
  role: 'member' | 'moderator' | 'admin' | 'owner'
}

// User context response types
export interface UserContext {
  user: User
  teams: TeamWithMembership[]
  preferences: UserPreferences
}

export interface UserTeamsResponse {
  teams: TeamWithMembership[]
  favorites: string[]
  defaultTeam?: Team
}

export interface ExportFilters {
  teamId?: string
  status?: 'open' | 'answered' | 'both'
  startDate?: string
  endDate?: string
  minUpvotes?: number
  maxUpvotes?: number
  tagIds?: string[]
  hasResponse?: 'true' | 'false'
  limit?: number
}

export interface ExportPreview {
  count: number
  preview: Question[]
  filters: ExportFilters
}

export interface CreateTeamRequest {
  name: string
  slug: string
  description?: string
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
  isActive?: boolean
}

// Zod schemas for runtime validation (kept for validation purposes)
const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z
    .object({
      questions: z.number(),
    })
    .optional(),
})

const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const QuestionTagSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  tagId: z.string(),
  createdAt: z.string(),
  tag: TagSchema,
})

const QuestionSchema = z.object({
  id: z.string(),
  body: z.string(),
  upvotes: z.number(),
  status: z.enum(['OPEN', 'ANSWERED', 'UNDER_REVIEW']),
  responseText: z.string().nullable(),
  respondedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  teamId: z.string().nullable(),
  team: TeamSchema.nullable().optional(),
  tags: z.array(QuestionTagSchema).optional(),
  // Moderation fields
  isPinned: z.boolean().optional(),
  pinnedBy: z.string().nullable().optional(),
  pinnedAt: z.string().nullable().optional(),
  isFrozen: z.boolean().optional(),
  frozenBy: z.string().nullable().optional(),
  frozenAt: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  moderationReasons: z.array(z.string()).optional(),
  moderationConfidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
  moderationProviders: z.array(z.enum(['local', 'openai'])).optional(),
})

// Export the full Question type with moderation fields for use in components
export type QuestionWithModeration = z.infer<typeof QuestionSchema>

// Validation schemas removed as they're not currently used

const HealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
})

const ExportPreviewSchema = z.object({
  count: z.number(),
  preview: z.array(QuestionSchema),
  filters: z.object({}).passthrough(),
})

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Add mock SSO and tenant headers for local development
    const mockSSOUser = localStorage.getItem('mock-sso-user')
    const mockTenant = localStorage.getItem('mock-tenant')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (mockSSOUser) {
      headers['x-mock-sso-user'] = mockSSOUser
    }

    // Add tenant header - defaults to 'default' if not set
    headers['x-tenant-id'] = mockTenant || 'default'

    const response = await fetch(url, {
      headers,
      credentials: 'include', // Always include credentials for session cookies
      ...options,
    })

    if (!response.ok) {
      // Try to extract error message from response body
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()

        // Handle moderation errors with reasons
        if (errorData.reasons && Array.isArray(errorData.reasons)) {
          errorMessage = errorData.error || 'Content flagged by moderation'
          errorMessage += '\n\nReasons:\n• ' + errorData.reasons.join('\n• ')
          if (errorData.moderationId) {
            errorMessage += `\n\n(Reference: ${errorData.moderationId})`
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          // Handle different error formats
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error
          } else if (errorData.error?.message) {
            // Nested error object with message
            errorMessage = errorData.error.message
          } else if (errorData.error?.formErrors?.[0]) {
            // Zod flattened error with form errors
            errorMessage = errorData.error.formErrors[0]
          } else if (errorData.error?.fieldErrors) {
            // Zod flattened error with field errors - extract first error
            const firstField = Object.keys(errorData.error.fieldErrors)[0]
            const fieldErrors = errorData.error.fieldErrors[firstField]
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
              errorMessage = `${firstField}: ${fieldErrors[0]}`
            }
          }
        }
      } catch {
        // If parsing fails, use default error message
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Validate response with schema
    try {
      return schema.parse(data)
    } catch (zodError: unknown) {
      // If schema validation fails, throw a more user-friendly error
      console.error('API response validation failed:', zodError)
      throw new Error(
        'Received invalid data from server. Please try again or contact support.'
      )
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request('/health', {}, HealthSchema)
  }

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    return this.request(
      '/questions',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      QuestionSchema
    )
  }

  async getQuestions(
    status?: 'OPEN' | 'ANSWERED',
    teamId?: string,
    filters?: {
      search?: string
      tagId?: string
      dateFrom?: string
      dateTo?: string
    }
  ): Promise<Question[]> {
    const params = new URLSearchParams()
    if (status) params.append('status', status.toLowerCase())
    if (teamId) params.append('teamId', teamId)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.tagId) params.append('tagId', filters.tagId)
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/questions${queryString}`, {}, z.array(QuestionSchema))
  }

  async getQuestion(id: string): Promise<Question> {
    return this.request(`/questions/${id}`, {}, QuestionSchema)
  }

  async upvoteQuestion(id: string): Promise<Question> {
    return this.request(
      `/questions/${id}/upvote`,
      {
        method: 'POST',
      },
      QuestionSchema
    )
  }

  async getUpvoteStatus(
    id: string
  ): Promise<{ hasUpvoted: boolean; canUpvote: boolean }> {
    return this.request(
      `/questions/${id}/upvote-status`,
      {
        method: 'GET',
      },
      z.object({
        hasUpvoted: z.boolean(),
        canUpvote: z.boolean(),
      })
    )
  }

  // Moderation Review Queue endpoints
  async getReviewQueue(filters?: {
    teamId?: string
    confidence?: string
  }): Promise<Question[]> {
    const params = new URLSearchParams()
    if (filters?.teamId) params.append('teamId', filters.teamId)
    if (filters?.confidence) params.append('confidence', filters.confidence)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return this.request(
      `/admin/moderation/review-queue${queryString}`,
      {},
      z.array(QuestionSchema)
    )
  }

  async approveQuestion(id: string): Promise<Question & { message?: string }> {
    return this.request(
      `/admin/moderation/approve/${id}`,
      {
        method: 'POST',
      },
      QuestionSchema.extend({ message: z.string().optional() })
    )
  }

  async rejectQuestion(
    id: string,
    reason?: string
  ): Promise<{ message: string; questionId: string }> {
    return this.request(
      `/admin/moderation/reject/${id}`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      z.object({
        message: z.string(),
        questionId: z.string(),
      })
    )
  }

  async respondToQuestion(
    id: string,
    data: RespondRequest,
    adminKey: string
  ): Promise<Question> {
    return this.request(
      `/questions/${id}/respond`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'x-admin-key': adminKey,
        },
      },
      QuestionSchema
    )
  }

  async searchQuestions(query: string, teamId?: string): Promise<Question[]> {
    if (!query || query.trim().length < 2) {
      return []
    }
    const params = new URLSearchParams()
    params.append('q', query.trim())
    if (teamId) params.append('teamId', teamId)
    return this.request(
      `/questions/search?${params.toString()}`,
      {},
      z.array(QuestionSchema)
    )
  }

  // Admin authentication methods
  async adminLogin(
    adminKey: string
  ): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const AdminLoginResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
      expiresIn: z.number(),
    })

    return this.request(
      '/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ adminKey }),
        credentials: 'include', // Important for session cookies
      },
      AdminLoginResponseSchema
    )
  }

  async adminLogout(): Promise<{ success: boolean; message: string }> {
    const AdminLogoutResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
    })

    return this.request(
      '/admin/logout',
      {
        method: 'POST',
        credentials: 'include',
      },
      AdminLogoutResponseSchema
    )
  }

  async getAdminStatus(): Promise<{
    isAuthenticated: boolean
    loginTime: number | null
    sessionAge: number | null
  }> {
    const AdminStatusSchema = z.object({
      isAuthenticated: z.boolean(),
      loginTime: z.number().nullable(),
      sessionAge: z.number().nullable(),
    })

    return this.request(
      '/admin/status',
      {
        credentials: 'include',
      },
      AdminStatusSchema
    )
  }

  // Updated respond method that uses session auth instead of admin key
  async respondToQuestionWithSession(
    id: string,
    data: RespondRequest
  ): Promise<Question> {
    return this.request(
      `/questions/${id}/respond`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include', // Use session instead of admin key header
      },
      QuestionSchema
    )
  }

  // Team management methods
  async getTeams(): Promise<Team[]> {
    return this.request('/teams', {}, z.array(TeamSchema))
  }

  async getTeamBySlug(slug: string): Promise<Team> {
    return this.request(`/teams/${slug}`, {}, TeamSchema)
  }

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    return this.request(
      '/teams',
      {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      },
      TeamSchema
    )
  }

  async updateTeam(id: string, data: UpdateTeamRequest): Promise<Team> {
    return this.request(
      `/teams/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
        credentials: 'include',
      },
      TeamSchema
    )
  }

  async deleteTeam(id: string): Promise<{ success: boolean; message: string }> {
    const DeleteTeamResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
    })

    return this.request(
      `/teams/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
      DeleteTeamResponseSchema
    )
  }

  // Tag management methods
  async getTags(): Promise<Tag[]> {
    return this.request('/tags', {}, z.array(TagSchema))
  }

  async createTag(data: CreateTagRequest): Promise<Tag> {
    // Schema validation removed as it's not currently used

    return this.request(
      '/tags',
      {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      },
      TagSchema
    )
  }

  async addTagToQuestion(
    questionId: string,
    tagId: string
  ): Promise<{ success: boolean }> {
    const AddTagResponseSchema = z.object({
      success: z.boolean(),
    })

    return this.request(
      `/questions/${questionId}/tags`,
      {
        method: 'POST',
        body: JSON.stringify({ tagId }),
        credentials: 'include',
      },
      AddTagResponseSchema
    )
  }

  async removeTagFromQuestion(
    questionId: string,
    tagId: string
  ): Promise<{ success: boolean }> {
    const RemoveTagResponseSchema = z.object({
      success: z.boolean(),
    })

    return this.request(
      `/questions/${questionId}/tags/${tagId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
      RemoveTagResponseSchema
    )
  }

  // Moderation methods
  async pinQuestion(questionId: string): Promise<Question> {
    return this.request(
      `/questions/${questionId}/pin`,
      {
        method: 'POST',
        credentials: 'include',
      },
      QuestionSchema
    )
  }

  async freezeQuestion(questionId: string): Promise<Question> {
    return this.request(
      `/questions/${questionId}/freeze`,
      {
        method: 'POST',
        credentials: 'include',
      },
      QuestionSchema
    )
  }

  async getModerationQueue(filters?: {
    status?: 'open' | 'answered'
    teamId?: string
    isPinned?: boolean
    isFrozen?: boolean
    needsReview?: boolean
    reviewedBy?: string
    limit?: number
    offset?: number
  }): Promise<{
    questions: Question[]
    total: number
    limit: number
    offset: number
  }> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const ModerationQueueSchema = z.object({
      questions: z.array(QuestionSchema),
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
    })

    return this.request(
      `/admin/moderation-queue?${params.toString()}`,
      {
        credentials: 'include',
      },
      ModerationQueueSchema
    )
  }

  async bulkTagQuestions(
    questionIds: string[],
    tagId: string,
    action: 'add' | 'remove'
  ): Promise<{
    success: boolean
    successCount: number
    errorCount: number
    total: number
  }> {
    const BulkTagResponseSchema = z.object({
      success: z.boolean(),
      successCount: z.number(),
      errorCount: z.number(),
      total: z.number(),
    })

    return this.request(
      '/admin/bulk-tag',
      {
        method: 'POST',
        body: JSON.stringify({ questionIds, tagId, action }),
        credentials: 'include',
      },
      BulkTagResponseSchema
    )
  }

  async bulkActionQuestions(
    questionIds: string[],
    action: 'pin' | 'unpin' | 'freeze' | 'unfreeze' | 'delete'
  ): Promise<{
    success: boolean
    successCount: number
    errorCount: number
    total: number
  }> {
    const BulkActionResponseSchema = z.object({
      success: z.boolean(),
      successCount: z.number(),
      errorCount: z.number(),
      total: z.number(),
    })

    return this.request(
      '/admin/bulk-action',
      {
        method: 'POST',
        body: JSON.stringify({ questionIds, action }),
        credentials: 'include',
      },
      BulkActionResponseSchema
    )
  }

  async getModerationStats(filters?: {
    teamId?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    overall: {
      totalQuestionsReviewed: number
      totalQuestionsAnswered: number
      totalQuestionsPinned: number
      totalQuestionsFrozen: number
      activeModerators: number
      avgResponseTime: number | null
    }
    byModerator: Array<{
      moderatorId: string
      moderatorName: string
      moderatorEmail: string
      questionsReviewed: number
      questionsAnswered: number
      questionsPinned: number
      questionsFrozen: number
      avgResponseTime: number | null
      teamsCount: number
    }>
  }> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const ModerationStatsSchema = z.object({
      overall: z.object({
        totalQuestionsReviewed: z.number(),
        totalQuestionsAnswered: z.number(),
        totalQuestionsPinned: z.number(),
        totalQuestionsFrozen: z.number(),
        activeModerators: z.number(),
        avgResponseTime: z.number().nullable(),
      }),
      byModerator: z.array(
        z.object({
          moderatorId: z.string(),
          moderatorName: z.string(),
          moderatorEmail: z.string(),
          questionsReviewed: z.number(),
          questionsAnswered: z.number(),
          questionsPinned: z.number(),
          questionsFrozen: z.number(),
          avgResponseTime: z.number().nullable(),
          teamsCount: z.number(),
        })
      ),
    })

    return this.request(
      `/admin/stats/moderation?${params.toString()}`,
      {
        credentials: 'include',
      },
      ModerationStatsSchema
    )
  }

  // Export methods
  async getExportPreview(filters: ExportFilters): Promise<ExportPreview> {
    const queryParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v.toString()))
        } else {
          queryParams.append(key, value.toString())
        }
      }
    })

    return this.request(
      `/admin/export/preview?${queryParams}`,
      {
        credentials: 'include',
      },
      ExportPreviewSchema
    )
  }

  async downloadExport(
    filters: ExportFilters,
    format: 'csv' | 'json'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v.toString()))
        } else {
          queryParams.append(key, value.toString())
        }
      }
    })

    queryParams.append('format', format)

    // Get the mock SSO user and tenant headers from localStorage
    const mockSSOUser = localStorage.getItem('mock-sso-user')
    const mockTenant = localStorage.getItem('mock-tenant')

    const response = await fetch(
      `${this.baseUrl}/admin/export/download?${queryParams}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(mockSSOUser && { 'x-mock-sso-user': mockSSOUser }),
          'x-tenant-id': mockTenant || 'default',
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Export failed: ${response.status} ${response.statusText}`
      )
    }

    return response.blob()
  }

  // Admin settings methods
  async getAdminSettings(): Promise<{
    tenant: {
      id: string
      name: string
      slug: string
      createdAt: string
      updatedAt: string
    }
  }> {
    const ResponseSchema = z.object({
      tenant: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    })

    return this.request(
      '/admin/settings',
      {
        credentials: 'include',
      },
      ResponseSchema
    )
  }

  async updateAdminSettings(data: { name?: string }): Promise<{
    success: boolean
    tenant: {
      id: string
      name: string
      slug: string
      createdAt: string
      updatedAt: string
    }
    message: string
  }> {
    const ResponseSchema = z.object({
      success: z.boolean(),
      tenant: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
      message: z.string(),
    })

    return this.request(
      '/admin/settings',
      {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(data),
      },
      ResponseSchema
    )
  }

  // Tenant Settings methods (advanced configuration)
  async getTenantSettings(): Promise<{
    settings: TenantSettingsType
  }> {
    const ResponseSchema = z.object({
      settings: z.object({
        questions: z.object({
          minLength: z.number(),
          maxLength: z.number(),
        }),
        users: z.object({
          defaultRole: z.enum([
            'viewer',
            'member',
            'moderator',
            'admin',
            'owner',
          ]),
        }),
        security: z.object({
          sessionTimeout: z.number(),
          adminSessionTimeout: z.number(),
          rateLimits: z.object({
            questionsPerHour: z.number(),
            upvotesPerMinute: z.number(),
            responsesPerHour: z.number(),
            searchPerMinute: z.number(),
          }),
        }),
        branding: z.object({
          primaryColor: z.string(),
          accentColor: z.string(),
          logoUrl: z.string().nullable(),
          faviconUrl: z.string().nullable(),
        }),
        features: z.object({
          allowAnonymousQuestions: z.boolean(),
          requireQuestionApproval: z.boolean(),
          enableEmailNotifications: z.boolean(),
        }),
      }),
    })

    return this.request(
      '/admin/tenant-settings',
      {
        credentials: 'include',
      },
      ResponseSchema
    )
  }

  async updateTenantSettings(data: Partial<TenantSettingsType>): Promise<{
    success: boolean
    settings: TenantSettingsType
    message: string
  }> {
    const ResponseSchema = z.object({
      success: z.boolean(),
      settings: z.any(),
      message: z.string(),
    })

    return this.request(
      '/admin/tenant-settings',
      {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(data),
      },
      ResponseSchema
    )
  }

  // User management methods
  async getCurrentUser(): Promise<User> {
    const UserSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      ssoId: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })

    return this.request(
      '/users/me',
      {
        credentials: 'include',
      },
      UserSchema
    )
  }

  async updateUserPreferences(
    data: UpdateUserPreferencesRequest
  ): Promise<UserPreferences> {
    // Schema validation removed as it's not currently used

    const UserPreferencesSchema = z.object({
      id: z.string(),
      userId: z.string(),
      favoriteTeams: z.array(z.string()),
      defaultTeamId: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      defaultTeam: TeamSchema.optional(),
    })

    return this.request(
      '/users/me/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(data),
        credentials: 'include',
      },
      UserPreferencesSchema
    )
  }

  async getUserTeams(): Promise<UserTeamsResponse> {
    const TeamWithMembershipSchema = TeamSchema.extend({
      userRole: z.enum(['member', 'moderator', 'admin', 'owner']).optional(),
      isFavorite: z.boolean().optional(),
      memberCount: z.number().optional(),
      members: z
        .array(
          z.object({
            id: z.string(),
            userId: z.string(),
            teamId: z.string(),
            role: z.enum(['member', 'moderator', 'admin', 'owner']),
            createdAt: z.string(),
            user: z
              .object({
                id: z.string(),
                email: z.string().email(),
                name: z.string().optional(),
              })
              .optional(),
          })
        )
        .optional(),
    })

    const UserTeamsResponseSchema = z.object({
      teams: z.array(TeamWithMembershipSchema),
      favorites: z.array(z.string()),
      defaultTeam: TeamSchema.nullable(),
    })

    return this.request(
      '/users/me/teams',
      {
        credentials: 'include',
      },
      UserTeamsResponseSchema
    )
  }

  async toggleTeamFavorite(teamId: string): Promise<{ isFavorite: boolean }> {
    const ToggleFavoriteResponseSchema = z.object({
      isFavorite: z.boolean(),
    })

    return this.request(
      `/users/me/teams/${teamId}/favorite`,
      {
        method: 'POST',
        credentials: 'include',
      },
      ToggleFavoriteResponseSchema
    )
  }

  async getUserQuestions(): Promise<Question[]> {
    const QuestionSchema = z.object({
      id: z.string(),
      body: z.string(),
      upvotes: z.number(),
      status: z.enum(['OPEN', 'ANSWERED', 'UNDER_REVIEW']),
      responseText: z.string().nullable().optional(),
      respondedAt: z.string().nullable().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      teamId: z.string().optional(),
      authorId: z.string().optional(),
      team: z
        .object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          isActive: z.boolean(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
        .optional(),
      author: z
        .object({
          id: z.string(),
          email: z.string().email(),
          name: z.string().optional(),
          ssoId: z.string().optional(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
        .optional(),
      tags: z
        .array(
          z.object({
            id: z.string(),
            questionId: z.string(),
            tagId: z.string(),
            createdAt: z.string(),
            tag: z.object({
              id: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              color: z.string(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          })
        )
        .optional(),
    })

    return this.request(
      '/users/me/questions',
      {
        credentials: 'include',
      },
      z.array(QuestionSchema)
    )
  }

  async updateTeamMember(
    teamId: string,
    userId: string,
    data: UpdateTeamMemberRequest
  ): Promise<TeamMembership> {
    // Schema validation removed as it's not currently used

    const TeamMembershipSchema = z.object({
      id: z.string(),
      userId: z.string(),
      teamId: z.string(),
      role: z.enum(['member', 'moderator', 'admin', 'owner']),
      createdAt: z.string(),
      user: z
        .object({
          id: z.string(),
          email: z.string().email(),
          name: z.string().optional(),
        })
        .optional(),
    })

    return this.request(
      `/teams/${teamId}/members/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
        credentials: 'include',
      },
      TeamMembershipSchema
    )
  }

  // Setup wizard methods
  async getSetupStatus(): Promise<{
    needsSetup: boolean
    teamCount: number
    userCount: number
    tenantId: string
    tenantSlug: string
  }> {
    const SetupStatusSchema = z.object({
      needsSetup: z.boolean(),
      teamCount: z.number(),
      userCount: z.number(),
      tenantId: z.string(),
      tenantSlug: z.string(),
    })

    return this.request('/setup/status', {}, SetupStatusSchema)
  }

  async updateSetupTenant(data: { name: string }): Promise<{
    success: boolean
    tenant: {
      id: string
      name: string
      slug: string
    }
    message: string
  }> {
    const ResponseSchema = z.object({
      success: z.boolean(),
      tenant: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
      message: z.string(),
    })

    return this.request(
      '/setup/tenant',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      ResponseSchema
    )
  }

  async createSetupTeam(data: {
    name: string
    slug: string
    description?: string
    loadDemoData?: boolean
  }): Promise<{
    success: boolean
    team: Team
    message: string
  }> {
    const SetupTeamResponseSchema = z.object({
      success: z.boolean(),
      team: TeamSchema,
      message: z.string(),
    })

    return this.request(
      '/setup/team',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      SetupTeamResponseSchema
    )
  }

  async loadSetupDemoData(): Promise<{
    success: boolean
    message: string
    restartRequired: boolean
  }> {
    const DemoDataResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
      restartRequired: z.boolean(),
    })

    return this.request(
      '/setup/demo-data',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      DemoDataResponseSchema
    )
  }

  async createSetupAdminUser(data: {
    name: string
    email: string
    teamId: string
  }): Promise<{
    success: boolean
    user: {
      id: string
      email: string
      name: string
    }
    message: string
  }> {
    const AdminUserResponseSchema = z.object({
      success: z.boolean(),
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
      }),
      message: z.string(),
    })

    return this.request(
      '/setup/admin-user',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      AdminUserResponseSchema
    )
  }

  // ========================================
  // Admin User Management Methods
  // ========================================

  async getAdminUsers(): Promise<{
    users: Array<{
      id: string
      email: string
      name: string | null
      ssoId: string | null
      createdAt: string
      updatedAt: string
      memberships: Array<{
        id: string
        teamId: string
        role: 'member' | 'moderator' | 'admin' | 'owner'
        createdAt: string
        team: {
          id: string
          name: string
          slug: string
          isActive: boolean
        }
      }>
      _count: {
        questions: number
        upvotes: number
      }
    }>
  }> {
    const AdminUsersResponseSchema = z.object({
      users: z.array(
        z.object({
          id: z.string(),
          email: z.string(),
          name: z.string().nullable(),
          ssoId: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string(),
          memberships: z.array(
            z.object({
              id: z.string(),
              teamId: z.string(),
              role: z.enum(['member', 'moderator', 'admin', 'owner']),
              createdAt: z.string(),
              team: z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                isActive: z.boolean(),
              }),
            })
          ),
          _count: z.object({
            questions: z.number(),
            upvotes: z.number(),
          }),
        })
      ),
    })

    return this.request('/admin/users', {}, AdminUsersResponseSchema)
  }

  async getTeamMembers(teamId: string): Promise<{
    members: Array<{
      id: string
      userId: string
      teamId: string
      role: 'member' | 'moderator' | 'admin' | 'owner'
      createdAt: string
      user: {
        id: string
        email: string
        name: string | null
        ssoId: string | null
        createdAt: string
      }
    }>
  }> {
    const TeamMembersResponseSchema = z.object({
      members: z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          teamId: z.string(),
          role: z.enum(['member', 'moderator', 'admin', 'owner']),
          createdAt: z.string(),
          user: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string().nullable(),
            ssoId: z.string().nullable(),
            createdAt: z.string(),
          }),
        })
      ),
    })

    return this.request(
      `/teams/${teamId}/members`,
      {},
      TeamMembersResponseSchema
    )
  }

  async addTeamMember(
    teamId: string,
    data: {
      userId: string
      role?: 'member' | 'moderator' | 'admin' | 'owner'
    }
  ): Promise<{
    success: boolean
    membership: {
      id: string
      userId: string
      teamId: string
      role: 'member' | 'moderator' | 'admin' | 'owner'
      createdAt: string
      user: {
        id: string
        email: string
        name: string | null
      }
      team: {
        id: string
        name: string
        slug: string
      }
    }
    message: string
  }> {
    const AddMemberResponseSchema = z.object({
      success: z.boolean(),
      membership: z.object({
        id: z.string(),
        userId: z.string(),
        teamId: z.string(),
        role: z.enum(['member', 'moderator', 'admin', 'owner']),
        createdAt: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string().nullable(),
        }),
        team: z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
        }),
      }),
      message: z.string(),
    })

    return this.request(
      `/teams/${teamId}/members`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      AddMemberResponseSchema
    )
  }

  async updateTeamMemberRole(
    teamId: string,
    userId: string,
    role: 'member' | 'moderator' | 'admin' | 'owner'
  ): Promise<{
    success: boolean
    membership: {
      id: string
      userId: string
      teamId: string
      role: 'member' | 'moderator' | 'admin' | 'owner'
      createdAt: string
      user: {
        id: string
        email: string
        name: string | null
      }
      team: {
        id: string
        name: string
        slug: string
      }
    }
    message: string
  }> {
    const UpdateMemberResponseSchema = z.object({
      success: z.boolean(),
      membership: z.object({
        id: z.string(),
        userId: z.string(),
        teamId: z.string(),
        role: z.enum(['member', 'moderator', 'admin', 'owner']),
        createdAt: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
          name: z.string().nullable(),
        }),
        team: z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
        }),
      }),
      message: z.string(),
    })

    return this.request(
      `/teams/${teamId}/members/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ role }),
      },
      UpdateMemberResponseSchema
    )
  }

  async removeTeamMember(
    teamId: string,
    userId: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    const RemoveMemberResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
    })

    return this.request(
      `/teams/${teamId}/members/${userId}`,
      {
        method: 'DELETE',
      },
      RemoveMemberResponseSchema
    )
  }

  async getHealthMetrics(): Promise<{
    status: string
    timestamp: string
    uptime: {
      seconds: number
      formatted: string
    }
    database: {
      status: string
      responseTimeMs: number | null
      provider: string
    }
    redis: {
      rateLimit: {
        connected: boolean
        ready: boolean
        enabled: boolean
      }
      sessions: {
        connected: boolean
        ready: boolean
      }
    }
    sse: {
      totalConnections: number
      tenantCount: number
      tenantConnections: Record<string, number>
    }
    memory: {
      rss: string
      heapTotal: string
      heapUsed: string
      external: string
    }
    data: {
      tenants: number
      questions: number
      users: number
    }
    environment: string
    nodeVersion: string
  }> {
    const HealthMetricsSchema = z.object({
      status: z.string(),
      timestamp: z.string(),
      uptime: z.object({
        seconds: z.number(),
        formatted: z.string(),
      }),
      database: z.object({
        status: z.string(),
        responseTimeMs: z.number().nullable(),
        provider: z.string(),
      }),
      redis: z.object({
        rateLimit: z.object({
          connected: z.boolean(),
          ready: z.boolean(),
          enabled: z.boolean(),
        }),
        sessions: z.object({
          connected: z.boolean(),
          ready: z.boolean(),
        }),
      }),
      sse: z.object({
        totalConnections: z.number(),
        tenantCount: z.number(),
        tenantConnections: z.record(z.string(), z.number()),
      }),
      memory: z.object({
        rss: z.string(),
        heapTotal: z.string(),
        heapUsed: z.string(),
        external: z.string(),
      }),
      data: z.object({
        tenants: z.number(),
        questions: z.number(),
        users: z.number(),
      }),
      environment: z.string(),
      nodeVersion: z.string(),
    })

    return this.request('/admin/health', {}, HealthMetricsSchema)
  }
}

export const apiClient = new ApiClient()

// Default export for easier importing
export default apiClient
