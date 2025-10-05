FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl postgresql-client
ENV NODE_ENV=production
ENV PORT=3000
LABEL org.opencontainers.image.title="PulseStage API"
LABEL org.opencontainers.image.description="PulseStage API - Ask Me Anything (AMA) platform for organizational engagement"
LABEL org.opencontainers.image.vendor="Sean M. Dalton"

# Install only production dependencies (excludes devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY --from=builder /app/prisma prisma
RUN npx prisma generate

# Copy built application and migrations
COPY --from=builder /app/dist dist
COPY --from=builder /app/openapi.yaml openapi.yaml
COPY --from=builder /app/scripts/start.sh scripts/start.sh
COPY --from=builder /app/load-comprehensive-test-data.js load-comprehensive-test-data.js

# Make startup script executable
RUN chmod +x scripts/start.sh

EXPOSE 3000
CMD ["./scripts/start.sh"]
