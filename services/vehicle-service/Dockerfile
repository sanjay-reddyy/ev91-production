FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl openssl-dev postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4004

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run dev"]
