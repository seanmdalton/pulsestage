import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { env } from "./env.js";
import { requireAdminKey } from "./middleware/adminAuth.js";
import { rateLimit, initRedis } from "./middleware/rateLimit.js";

const app = express();
const prisma = new PrismaClient();

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());

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

// Initialize Redis and start server
async function start() {
  await initRedis();
  
  app.listen(env.PORT, async () => {
    // Ensure schema is present when running outside CI/container
    try { await prisma.$executeRawUnsafe('SELECT 1'); } catch {}
    console.log(`ama-api listening on :${env.PORT}`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}`);
    console.log(`Admin key: ${env.ADMIN_KEY ? 'configured' : 'not configured'}`);
  });
}

start().catch(console.error);
