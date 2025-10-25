# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl openssl-dev postgresql-client

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --no-package-lock

# Copy the rest of the source code
COPY . ./

# Generate Prisma client
RUN npx prisma generate

# Skip TypeScript build for now - run in development mode
# RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-alpine AS prod

# Install runtime dependencies and ts-node-dev globally
RUN apk add --no-cache dumb-init openssl postgresql-client && \
    npm install -g ts-node-dev

WORKDIR /app

# Copy everything from builder
COPY --from=builder /app /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S spare-parts-user -u 1001 && \
    chown -R spare-parts-user:nodejs /app

USER spare-parts-user

EXPOSE 4010
ENV NODE_ENV=production

# Run schema push (creates tables), seed, then start in development mode
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx ts-node prisma/seed.ts && npm run dev"]