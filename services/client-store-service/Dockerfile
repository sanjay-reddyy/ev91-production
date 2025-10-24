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

# Expose port
EXPOSE 3006

# Run migrations, seed DB, and start the app
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/src/index.js"]
