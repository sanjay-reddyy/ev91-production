FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl openssl-dev postgresql-client

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4004

# Run fresh migrations and start production server
CMD ["sh", "-c", "npx prisma migrate reset --force && npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
