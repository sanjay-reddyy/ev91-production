FROM node:20-alpine AS builder

WORKDIR /app/rider-service

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files and remove shared-utils dependency for Docker build
COPY package*.json ./
RUN npm pkg delete dependencies.@ev91/shared-utils || echo "No shared-utils dependency to remove"

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . ./

# Prisma generate if exists
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS prod

WORKDIR /app/rider-service

COPY --from=builder /app/rider-service /app/rider-service

ENV NODE_ENV=production
ENV PORT=4005
EXPOSE 4005

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/index.js"]
