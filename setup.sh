#! /bin/bash

set -euo pipefail

mkdir -p api/src prisma .github/workflows .devcontainer

# Root .gitignore
cat > .gitignore <<'EOF'
node_modules
dist
.env
.DS_Store
.vscode
coverage
EOF

# docker-compose.yaml
cat > docker-compose.yaml <<'EOF'
version: "3.9"
services:
  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/ama
      PORT: "3000"
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: ama
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
EOF

# Devcontainer (optional but nice in Cursor)
cat > .devcontainer/devcontainer.json <<'EOF'
{
  "name": "ama-app",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "postCreateCommand": "echo Devcontainer ready",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode"
      ]
    }
  },
  "remoteUser": "node"
}
EOF

# --- API ---

cat > api/package.json <<'EOF'
{
  "name": "ama-api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "db:push": "prisma db push",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.15.1",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.12",
    "prisma": "^5.15.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.4",
    "vitest": "^1.6.0"
  }
}
EOF

cat > api/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
EOF

mkdir -p api/prisma
cat > api/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum QuestionStatus {
  OPEN
  ANSWERED
}

model Question {
  id           String         @id @default(uuid())
  body         String
  upvotes      Int            @default(0)
  status       QuestionStatus @default(OPEN)
  responseText String?
  respondedAt  DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}
EOF

cat > api/src/index.ts <<'EOF'
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
  const where = status === "ANSWERED" ? { status: "ANSWERED" } : { status: "OPEN" };
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
EOF

cat > api/vitest.config.ts <<'EOF'
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] }
});
EOF

# Tiny sample test
cat > api/src/sum.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
describe("sum", () => {
  it("adds", () => expect(2 + 2).toBe(4));
});
EOF

# API Dockerfile
cat > api/Dockerfile <<'EOF'
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/dist dist
COPY --from=builder /app/prisma prisma
EXPOSE 3000
CMD ["sh","-c","npx prisma db push && node dist/index.js"]
EOF

# --- GitHub Actions ---

cat > .github/workflows/ci.yml <<'EOF'
name: CI
on:
  push:
  pull_request:

jobs:
  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
          POSTGRES_DB: ama
        ports: ["5432:5432"]
        options: >-
          --health-cmd="pg_isready -U app -d ama"
          --health-interval=10s --health-timeout=5s --health-retries=5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: api/package-lock.json
      - run: npm ci
        working-directory: api
      - name: Push schema to ephemeral DB
        run: npx prisma db push
        working-directory: api
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/ama
      - run: npm test -- --coverage
        working-directory: api
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/ama
          REDIS_URL: redis://localhost:6379
      - uses: actions/upload-artifact@v4
        with:
          name: api-coverage
          path: api/coverage
EOF

cat > .github/workflows/docker.yml <<'EOF'
name: Build & Push Images
on:
  push:
    branches: [ main ]

jobs:
  api-image:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}-api
      - name: Build & push API
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
EOF

echo "Scaffold complete."
