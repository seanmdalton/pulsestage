# ==============================================================================
# STAGE 1: Dependencies
# ==============================================================================
FROM node:24.11.0-alpine AS deps
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# ==============================================================================
# STAGE 2: Builder
# ==============================================================================
FROM node:24.11.0-alpine AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application (moduleResolution: Node)
RUN npm run build

# ==============================================================================
# STAGE 3: Production Runtime
# ==============================================================================
FROM node:24.11.0-alpine

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    openssl \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Add image metadata
LABEL org.opencontainers.image.title="PulseStage API"
LABEL org.opencontainers.image.description="PulseStage API - Ask Me Anything (AMA) platform for organizational engagement"
LABEL org.opencontainers.image.vendor="Sean M. Dalton"
LABEL org.opencontainers.image.source="https://github.com/seanmdalton/pulsestage"

# Change ownership of /app directory to nodejs user before switching
RUN chown -R nodejs:nodejs /app

# Switch to non-root user before installing dependencies
USER nodejs

# Install only production dependencies  
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit && \
    npm cache clean --force

# Copy Prisma schema and generate client
COPY --chown=nodejs:nodejs --from=builder /app/prisma prisma
RUN npx prisma generate

# Copy built application
COPY --chown=nodejs:nodejs --from=builder /app/dist dist
COPY --chown=nodejs:nodejs --from=builder /app/openapi.yaml openapi.yaml
COPY --chown=nodejs:nodejs --from=builder /app/scripts/start.sh scripts/start.sh

# Make startup script executable
RUN chmod +x scripts/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3000

# Start application
CMD ["./scripts/start.sh"]
