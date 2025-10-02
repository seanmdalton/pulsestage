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
    body: z.string().min(3).max(2000),
    teamId: z.string().optional()
  });

  // Rate limited: 10 requests per minute per IP
  app.post("/questions", rateLimit("create-question", 10), async (req, res) => {
    const parse = createQuestionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    
    // Validate teamId if provided
    if (parse.data.teamId) {
      const team = await prisma.team.findUnique({ where: { id: parse.data.teamId } });
      if (!team || !team.isActive) {
        return res.status(400).json({ error: "Invalid or inactive team" });
      }
    }
    
    const q = await prisma.question.create({ 
      data: { 
        body: parse.data.body,
        teamId: parse.data.teamId || null
      },
      include: {
        team: true
      }
    });
    res.status(201).json(q);
  });

  app.get("/questions", async (req, res) => {
    const status = (req.query.status as string)?.toUpperCase();
    const teamId = req.query.teamId as string;
    
    const where: any = status === "ANSWERED" ? { status: "ANSWERED" as const } : { status: "OPEN" as const };
    
    // Add team filter if provided
    if (teamId) {
      where.teamId = teamId;
    }
    
    const list = await prisma.question.findMany({
      where,
      include: {
        team: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
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

  // Team management endpoints
  const createTeamSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    description: z.string().max(500).optional()
  });

  const updateTeamSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional()
  });

  // Get all teams (public endpoint)
  app.get("/teams", async (req, res) => {
    try {
      const teams = await prisma.team.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        },
        orderBy: { name: "asc" }
      });
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get team by slug (public endpoint)
  app.get("/teams/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
      const team = await prisma.team.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
      
      if (!team || !team.isActive) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  // Create team (admin only)
  app.post("/teams", requireAdminSession, async (req, res) => {
    const parse = createTeamSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    try {
      // Check if slug already exists
      const existingTeam = await prisma.team.findUnique({
        where: { slug: parse.data.slug }
      });
      
      if (existingTeam) {
        return res.status(409).json({ error: "Team with this slug already exists" });
      }

      const team = await prisma.team.create({
        data: parse.data,
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
      
      res.status(201).json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  // Update team (admin only)
  app.put("/teams/:id", requireAdminSession, async (req, res) => {
    const { id } = req.params;
    const parse = updateTeamSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    try {
      const team = await prisma.team.update({
        where: { id },
        data: parse.data,
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
      
      res.json(team);
    } catch (error: any) {
      console.error('Error updating team:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Team not found" });
      }
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  // Deactivate team (admin only) - soft delete
  app.delete("/teams/:id", requireAdminSession, async (req, res) => {
    const { id } = req.params;
    
    try {
      const team = await prisma.team.update({
        where: { id },
        data: { isActive: false }
      });
      
      res.json({ success: true, message: "Team deactivated successfully" });
    } catch (error: any) {
      console.error('Error deactivating team:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Team not found" });
      }
      res.status(500).json({ error: "Failed to deactivate team" });
    }
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
    const { q: query, teamId } = req.query;
    
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
        const whereClause: any = {
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
        };
        
        // Add team filter if provided
        if (teamId && typeof teamId === 'string') {
          whereClause.teamId = teamId;
        }
        
        const questions = await prisma.question.findMany({
          where: whereClause,
          include: {
            team: true,
            tags: {
              include: {
                tag: true
              }
            }
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
      const searchWhereClause: any = {
        OR: [
          ...bodyConditions,
          ...responseConditions
        ]
      };
      
      // Add team filter if provided
      if (teamId && typeof teamId === 'string') {
        searchWhereClause.teamId = teamId;
      }
      
      const questions = await prisma.question.findMany({
        where: searchWhereClause,
        include: {
          team: true,
          tags: {
            include: {
              tag: true
            }
          }
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

// Export endpoints (admin only)
    
    // Get export preview
    app.get("/admin/export/preview", requireAdminSession, async (req, res) => {
      try {
        const filters = req.query;
        
        // Build where clause based on filters
        const where: any = {};
        
        // Team filter
        if (filters.teamId && filters.teamId !== 'all') {
          where.teamId = filters.teamId;
        }
        
        // Status filter
        if (filters.status && filters.status !== 'both' && typeof filters.status === 'string') {
          where.status = filters.status.toUpperCase();
        }
        
        // Date range filter
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) {
            where.createdAt.gte = new Date(filters.startDate as string);
          }
          if (filters.endDate) {
            where.createdAt.lte = new Date(filters.endDate as string);
          }
        }
        
        // Upvote range filter
        if (filters.minUpvotes || filters.maxUpvotes) {
          where.upvotes = {};
          if (filters.minUpvotes) {
            where.upvotes.gte = parseInt(filters.minUpvotes as string);
          }
          if (filters.maxUpvotes) {
            where.upvotes.lte = parseInt(filters.maxUpvotes as string);
          }
        }
        
        // Tag filter (if specified)
        if (filters.tagIds) {
          const tagIds = Array.isArray(filters.tagIds) ? filters.tagIds : [filters.tagIds];
          where.tags = {
            some: {
              tagId: {
                in: tagIds
              }
            }
          };
        }
        
        // Response filter
        if (filters.hasResponse === 'true') {
          where.responseText = { not: null };
        } else if (filters.hasResponse === 'false') {
          where.responseText = null;
        }
        
        // Get questions with all related data
        const questions = await prisma.question.findMany({
          where,
          include: {
            team: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: [
            { status: 'asc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters.limit ? parseInt(filters.limit as string) : 100 // Limit preview to 100
        });
        
        res.json({
          count: questions.length,
          preview: questions,
          filters: filters
        });
      } catch (error) {
        console.error('Error fetching export preview:', error);
        res.status(500).json({ error: 'Failed to fetch export preview' });
      }
    });
    
    // Download export
    app.get("/admin/export/download", requireAdminSession, async (req, res) => {
      try {
        const filters = req.query;
        const format = (filters.format as string) || 'csv';
        
        // Build where clause (same as preview)
        const where: any = {};
        
        if (filters.teamId && filters.teamId !== 'all') {
          where.teamId = filters.teamId;
        }
        
        if (filters.status && filters.status !== 'both' && typeof filters.status === 'string') {
          where.status = filters.status.toUpperCase();
        }
        
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) {
            where.createdAt.gte = new Date(filters.startDate as string);
          }
          if (filters.endDate) {
            where.createdAt.lte = new Date(filters.endDate as string);
          }
        }
        
        if (filters.minUpvotes || filters.maxUpvotes) {
          where.upvotes = {};
          if (filters.minUpvotes) {
            where.upvotes.gte = parseInt(filters.minUpvotes as string);
          }
          if (filters.maxUpvotes) {
            where.upvotes.lte = parseInt(filters.maxUpvotes as string);
          }
        }
        
        if (filters.tagIds) {
          const tagIds = Array.isArray(filters.tagIds) ? filters.tagIds : [filters.tagIds];
          where.tags = {
            some: {
              tagId: {
                in: tagIds
              }
            }
          };
        }
        
        if (filters.hasResponse === 'true') {
          where.responseText = { not: null };
        } else if (filters.hasResponse === 'false') {
          where.responseText = null;
        }
        
        // Get all questions matching filters
        const questions = await prisma.question.findMany({
          where,
          include: {
            team: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: [
            { status: 'asc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' }
          ]
        });
        
        if (format === 'csv') {
          // Generate CSV
          const csvHeaders = [
            'id', 'body', 'upvotes', 'status', 'responseText', 'respondedAt', 
            'createdAt', 'updatedAt', 'teamId', 'teamName', 'teamSlug', 'tags'
          ];
          
          const csvRows = questions.map(q => {
            const tags = q.tags.map(qt => `${qt.tag.name}(${qt.tag.id})`).join(';');
            return [
              q.id,
              `"${q.body.replace(/"/g, '""')}"`, // Escape quotes in CSV
              q.upvotes,
              q.status,
              q.responseText ? `"${q.responseText.replace(/"/g, '""')}"` : '',
              q.respondedAt?.toISOString() || '',
              q.createdAt.toISOString(),
              q.updatedAt.toISOString(),
              q.teamId || '',
              q.team?.name || '',
              q.team?.slug || '',
              `"${tags}"`
            ].join(',');
          });
          
          const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="ama-export-${new Date().toISOString().split('T')[0]}.csv"`);
          res.send(csvContent);
          
        } else if (format === 'json') {
          // Generate JSON
          const exportData = {
            exportedAt: new Date().toISOString(),
            filters: filters,
            totalCount: questions.length,
            questions: questions.map(q => ({
              ...q,
              createdAt: q.createdAt.toISOString(),
              updatedAt: q.updatedAt.toISOString(),
              respondedAt: q.respondedAt?.toISOString() || null,
              team: q.team ? {
                ...q.team,
                createdAt: q.team.createdAt.toISOString(),
                updatedAt: q.team.updatedAt.toISOString()
              } : null,
              tags: q.tags.map(qt => ({
                ...qt,
                createdAt: qt.createdAt.toISOString(),
                tag: {
                  ...qt.tag,
                  createdAt: qt.tag.createdAt.toISOString(),
                  updatedAt: qt.tag.updatedAt.toISOString()
                }
              }))
            }))
          };
          
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="ama-export-${new Date().toISOString().split('T')[0]}.json"`);
          res.json(exportData);
          
        } else {
          res.status(400).json({ error: 'Invalid format. Use csv or json.' });
        }
        
      } catch (error) {
        console.error('Error generating export:', error);
        res.status(500).json({ error: 'Failed to generate export' });
      }
    });

// Tag endpoints (admin only)
    
    // Get all tags
    app.get("/tags", requireAdminSession, async (_req, res) => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Create a new tag
  app.post("/tags", requireAdminSession, async (req, res) => {
    const createTagSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
    });

    const parse = createTagSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    try {
      const tag = await prisma.tag.create({
        data: {
          name: parse.data.name,
          description: parse.data.description,
          color: parse.data.color || '#3B82F6'
        }
      });
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ error: 'Tag with this name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create tag' });
      }
    }
  });

  // Add tag to question
  app.post("/questions/:id/tags", requireAdminSession, async (req, res) => {
    const { id } = req.params;
    const addTagSchema = z.object({
      tagId: z.string().uuid()
    });

    const parse = addTagSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    try {
      // Check if question exists
      const question = await prisma.question.findUnique({ where: { id } });
      if (!question) return res.status(404).json({ error: 'Question not found' });

      // Check if tag exists
      const tag = await prisma.tag.findUnique({ where: { id: parse.data.tagId } });
      if (!tag) return res.status(404).json({ error: 'Tag not found' });

      // Add tag to question (upsert to handle duplicates)
      await prisma.questionTag.upsert({
        where: {
          questionId_tagId: {
            questionId: id,
            tagId: parse.data.tagId
          }
        },
        update: {},
        create: {
          questionId: id,
          tagId: parse.data.tagId
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error adding tag to question:', error);
      res.status(500).json({ error: 'Failed to add tag to question' });
    }
  });

  // Remove tag from question
  app.delete("/questions/:id/tags/:tagId", requireAdminSession, async (req, res) => {
    const { id, tagId } = req.params;

    try {
      await prisma.questionTag.delete({
        where: {
          questionId_tagId: {
            questionId: id,
            tagId: tagId
          }
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing tag from question:', error);
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        res.status(404).json({ error: 'Tag not found on question' });
      } else {
        res.status(500).json({ error: 'Failed to remove tag from question' });
      }
    }
  });

  return app;
}

