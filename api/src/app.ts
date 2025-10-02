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
import { createSessionMiddleware } from "./middleware/session.js";
import { requireAdminSession } from "./middleware/adminSession.js";

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

  // Session middleware
  app.use(createSessionMiddleware());

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

  // Admin authentication endpoints
  const adminLoginSchema = z.object({
    adminKey: z.string().min(1)
  });

  app.post("/admin/login", async (req, res) => {
    console.log('🔐 Admin login attempt:', { 
      hasSession: !!req.session, 
      sessionId: req.sessionID,
      userAgent: req.get('User-Agent')?.substring(0, 50) 
    });
    
    const parse = adminLoginSchema.safeParse(req.body);
    if (!parse.success) {
      console.log('❌ Login failed: Invalid request body');
      return res.status(400).json({ error: "Admin key is required" });
    }

    if (parse.data.adminKey !== env.ADMIN_KEY) {
      console.log('❌ Login failed: Invalid admin key');
      return res.status(401).json({ error: "Invalid admin key" });
    }

    // Set admin session
    req.session.isAdmin = true;
    req.session.loginTime = Date.now();
    
    console.log('✅ Admin login successful:', { 
      sessionId: req.sessionID,
      loginTime: req.session.loginTime 
    });

    res.json({ 
      success: true, 
      message: "Admin login successful",
      expiresIn: 30 * 60 * 1000 // 30 minutes
    });
  });

  app.post("/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  app.get("/admin/status", (req, res) => {
    const isAdmin = !!req.session?.isAdmin;
    const loginTime = req.session?.loginTime;
    
    res.json({ 
      isAuthenticated: isAdmin,
      loginTime: loginTime || null,
      sessionAge: loginTime ? Date.now() - loginTime : null
    });
  });

  // Protected by admin session (new approach)
  app.post("/questions/:id/respond", requireAdminSession, async (req, res) => {
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

  // Legacy endpoint - still protected by admin key for backward compatibility
  app.post("/questions/:id/respond-legacy", requireAdminKey, async (req, res) => {
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

  // Search questions endpoint with improved fuzzy matching
  app.get("/questions/search", async (req, res) => {
    const { q: query } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = query.trim();
    
    try {
      // Extract meaningful keywords from the search query
      const extractKeywords = (text: string): string[] => {
        // Remove common stop words and extract meaningful terms
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'can', 'you', 'we', 'i', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'about', 'there', 'when', 'where', 'why', 'how', 'what', 'who', 'which', 'this', 'that', 'these', 'those']);
        
        return text
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.has(word))
          .slice(0, 5); // Limit to 5 most relevant keywords
      };

      const keywords = extractKeywords(searchTerm);
      
      if (keywords.length === 0) {
        // Fallback to original search if no keywords extracted
        const questions = await prisma.question.findMany({
          where: {
            OR: [
              {
                body: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                responseText: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          },
          orderBy: [
            { status: 'asc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 10
        });
        return res.json(questions);
      }

      // Build dynamic OR conditions for each keyword
      const bodyConditions = keywords.map(keyword => ({
        body: {
          contains: keyword,
          mode: 'insensitive' as const
        }
      }));

      const responseConditions = keywords.map(keyword => ({
        responseText: {
          contains: keyword,
          mode: 'insensitive' as const
        }
      }));

      // Search with keyword-based matching
      const questions = await prisma.question.findMany({
        where: {
          OR: [
            ...bodyConditions,
            ...responseConditions
          ]
        },
        orderBy: [
          { status: 'asc' }, // OPEN questions first
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10
      });

      // Score and rank results based on keyword matches
      const scoredQuestions = questions.map(question => {
        let score = 0;
        const bodyLower = question.body.toLowerCase();
        const responseLower = (question.responseText || '').toLowerCase();
        
        // Score based on keyword matches
        keywords.forEach(keyword => {
          if (bodyLower.includes(keyword)) score += 2; // Body matches are more important
          if (responseLower.includes(keyword)) score += 1;
        });
        
        // Bonus for exact phrase matches
        if (bodyLower.includes(searchTerm.toLowerCase())) score += 5;
        if (responseLower.includes(searchTerm.toLowerCase())) score += 3;
        
        // Bonus for status and popularity
        if (question.status === 'OPEN') score += 1;
        score += question.upvotes * 0.1;
        
        return { ...question, searchScore: score };
      });

      // Sort by search score, then by original criteria
      const rankedQuestions = scoredQuestions
        .filter(q => q.searchScore > 0)
        .sort((a, b) => {
          if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
          if (a.status !== b.status) return a.status === 'OPEN' ? -1 : 1;
          if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 10)
        .map(({ searchScore, ...question }) => question); // Remove score from response

      res.json(rankedQuestions);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  return app;
}

