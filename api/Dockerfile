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
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV PORT=3000
LABEL org.opencontainers.image.title="PulseStage API"
LABEL org.opencontainers.image.description="PulseStage API - Ask Me Anything (AMA) platform for organizational engagement"
LABEL org.opencontainers.image.vendor="Sean M. Dalton"
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/dist dist
COPY --from=builder /app/prisma prisma
COPY --from=builder /app/openapi.yaml openapi.yaml
EXPOSE 3000
CMD ["sh","-c","npx prisma db push && node dist/server.js"]
