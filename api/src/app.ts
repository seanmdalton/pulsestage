import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { env } from "./env.js";
import { requireAdminKey } from "./middleware/adminAuth.js";
import { rateLimit } from "./middleware/rateLimit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(prisma: PrismaClient) {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  }));

  app.use(express.json());

  // Swagger UI - only in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const openapiPath = join(__dirname, '..', 'openapi.yaml');
      const openapiContent = readFileSync(openapiPath, 'utf8');
      const openapiSpec = parseYaml(openapiContent);
      
      app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
        customSiteTitle: 'AMA API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
      }));
      
      console.log('📚 API documentation available at /docs');
    } catch (error) {
      console.warn('⚠️  Failed to load OpenAPI spec:', error);
    }
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "ama-api" });
  });

  const createQuestionSchema = z.object({
    body: z.string().min(3).max(2000)
  });

  // Rate limited: 10 requests per minute per IP
  app.post("/questions", rateLimit("create-question", 10), async (req, res) => {
    const parse = createQuestionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const q = await prisma.question.create({ data: { body: parse.data.body } });
    res.status(201).json(q);
  });

  app.get("/questions", async (req, res) => {
    const status = (req.query.status as string)?.toUpperCase();
    const where = status === "ANSWERED" ? { status: "ANSWERED" as const } : { status: "OPEN" as const };
    const list = await prisma.question.findMany({
      where,
      orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }]
    });
    res.json(list);
  });

  // Rate limited: 10 requests per minute per IP
  app.post("/questions/:id/upvote", rateLimit("upvote", 10), async (req, res) => {
    const { id } = req.params;
    try {
      const q = await prisma.question.update({
        where: { id },
        data: { upvotes: { increment: 1 } }
      });
      res.json(q);
    } catch {
      res.status(404).json({ error: "Not found" });
    }
  });

  const respondSchema = z.object({
    response: z.string().min(1).max(10000)
  });

  // Protected by admin key
  app.post("/questions/:id/respond", requireAdminKey, async (req, res) => {
    const { id } = req.params;
    const parse = respondSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    try {
      const q = await prisma.question.update({
        where: { id },
        data: {
          status: "ANSWERED",
          responseText: parse.data.response,
          respondedAt: new Date()
        }
      });
      res.json(q);
    } catch {
      res.status(404).json({ error: "Not found" });
    }
  });

  return app;
}

