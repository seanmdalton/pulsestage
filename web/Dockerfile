# ==============================================================================
# STAGE 1: Dependencies
# ==============================================================================
FROM node:24-alpine AS deps
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# ==============================================================================
# STAGE 2: Builder
# ==============================================================================
FROM node:24-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules node_modules

# Copy source code
COPY . .

# Build application (skip if NODE_ENV=development)
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm run build; \
    else \
      echo "Skipping build in development mode"; \
    fi

# ==============================================================================
# STAGE 3: Production Runtime (nginx)
# ==============================================================================
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add security headers and caching configuration
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 5173;' >> /etc/nginx/conf.d/default.conf && \
    echo '  root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '  # Security headers' >> /etc/nginx/conf.d/default.conf && \
    echo '  add_header X-Frame-Options "SAMEORIGIN" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '  add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '  add_header X-XSS-Protection "1; mode=block" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '  add_header Referrer-Policy "strict-origin-when-cross-origin" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '  # Gzip compression' >> /etc/nginx/conf.d/default.conf && \
    echo '  gzip on;' >> /etc/nginx/conf.d/default.conf && \
    echo '  gzip_vary on;' >> /etc/nginx/conf.d/default.conf && \
    echo '  gzip_min_length 1024;' >> /etc/nginx/conf.d/default.conf && \
    echo '  gzip_types text/css text/javascript application/javascript application/json image/svg+xml;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '  # Cache static assets' >> /etc/nginx/conf.d/default.conf && \
    echo '  location /assets {' >> /etc/nginx/conf.d/default.conf && \
    echo '    expires 1y;' >> /etc/nginx/conf.d/default.conf && \
    echo '    add_header Cache-Control "public, immutable";' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '  # SPA fallback' >> /etc/nginx/conf.d/default.conf && \
    echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '  # Health check endpoint' >> /etc/nginx/conf.d/default.conf && \
    echo '  location /health {' >> /etc/nginx/conf.d/default.conf && \
    echo '    access_log off;' >> /etc/nginx/conf.d/default.conf && \
    echo '    return 200 "OK";' >> /etc/nginx/conf.d/default.conf && \
    echo '    add_header Content-Type text/plain;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Add image metadata
LABEL org.opencontainers.image.title="PulseStage Web"
LABEL org.opencontainers.image.description="PulseStage Web App - Ask Me Anything (AMA) platform frontend for organizational engagement"
LABEL org.opencontainers.image.vendor="Sean M. Dalton"
LABEL org.opencontainers.image.source="https://github.com/seanmdalton/pulsestage"

# Change ownership to non-root user
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5173/health || exit 1

# Expose port
EXPOSE 5173

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ==============================================================================
# STAGE 4: Development Runtime
# ==============================================================================
FROM node:24-alpine AS development

WORKDIR /app

# Add image metadata
LABEL org.opencontainers.image.title="PulseStage Web (Development)"
LABEL org.opencontainers.image.description="PulseStage Web App - Development Mode"
LABEL org.opencontainers.image.vendor="Sean M. Dalton"

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
