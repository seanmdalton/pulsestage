import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ama-api" });
});

const createQuestionSchema = z.object({
  body: z.string().min(3).max(2000)
});

app.post("/questions", async (req, res) => {
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

app.post("/questions/:id/upvote", async (req, res) => {
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

app.post("/questions/:id/respond", async (req, res) => {
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

app.listen(PORT, async () => {
  // Ensure schema is present when running outside CI/container
  try { await prisma.$executeRawUnsafe('SELECT 1'); } catch {}
  console.log(`ama-api listening on :${PORT}`);
});
