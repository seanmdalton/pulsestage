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

export { QuestionSchema, CreateQuestionSchema, RespondSchema, HealthSchema };
