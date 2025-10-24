# -----------------------------
# Base stage: install dependencies for native modules
# -----------------------------
FROM node:20-alpine AS base

# Install dependencies for native modules + OpenSSL
RUN apk add --no-cache python3 make g++ libc6-compat dumb-init openssl

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./ 
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# -----------------------------
# Development stage
# -----------------------------
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Copy all source code
COPY . .

# Expose port for dev
EXPOSE 4010

# Set development environment
ENV NODE_ENV=development

# Start dev server
CMD ["npm", "run", "dev"]

# -----------------------------
# Build stage
# -----------------------------
FROM base AS build

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript application
RUN npm run build

# -----------------------------
# Production stage (fixed)
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init openssl

WORKDIR /app

COPY package*.json ./ 
COPY prisma ./prisma/

# Install devDependencies temporarily for tsx
RUN npm ci --include=dev

# Generate Prisma client
RUN npx prisma generate

# Copy built app
COPY --from=build /app/dist ./dist

# Remove devDependencies for slim image
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S spare-parts-user -u 1001 \
    && chown -R spare-parts-user:nodejs /app

USER spare-parts-user

EXPOSE 4010
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4010/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

# Run migrations, seed, then start app AT RUNTIME
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]