import { z } from 'zod';

// API Response schemas
const QuestionSchema = z.object({
  id: z.string(),
  body: z.string(),
  upvotes: z.number(),
  status: z.enum(['OPEN', 'ANSWERED']),
  responseText: z.string().nullable(),
  respondedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateQuestionSchema = z.object({
  body: z.string().min(3).max(2000),
});

const RespondSchema = z.object({
  response: z.string().min(1).max(10000),
});

const HealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
});

export type Question = z.infer<typeof QuestionSchema>;
export type CreateQuestionRequest = z.infer<typeof CreateQuestionSchema>;
export type RespondRequest = z.infer<typeof RespondSchema>;
export type HealthResponse = z.infer<typeof HealthSchema>;

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

  async getQuestions(status?: 'OPEN' | 'ANSWERED'): Promise<Question[]> {
    const params = status ? `?status=${status.toLowerCase()}` : '';
    return this.request(`/questions${params}`, {}, z.array(QuestionSchema));
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
}

export const apiClient = new ApiClient();

// Default export for easier importing
export default apiClient;
