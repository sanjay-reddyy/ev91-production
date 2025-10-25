FROM node:20-alpine

WORKDIR /app

# Install bash and build tools for Prisma
RUN apk add --no-cache bash build-base python3

# Copy package files
COPY package*.json ./

# Install all dependencies (include dev for Prisma)
RUN npm install --include=dev --legacy-peer-deps

# Copy source code
COPY . .

# Install Prisma CLI globally (so npx can find it)
RUN npm install -g prisma

RUN npm install -g tsx

RUN npm install -g typescript

# Generate Prisma client if prisma exists
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# Build TypeScript to JavaScript
RUN npm run build

# Sanity check: List contents of dist folder
RUN ls -la dist

# Install ts-node-dev globally for development mode
RUN npm install -g ts-node-dev

# Expose port
EXPOSE 3006

# Start the service (try production first, fallback to development mode)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (node dist/src/index.js || npx ts-node-dev --respawn --transpile-only src/index.ts)"]
