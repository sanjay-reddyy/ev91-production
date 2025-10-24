FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native packages (like canvas)
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

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client if prisma exists
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# Expose port
EXPOSE 4005

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm run dev"]