# -----------------------------
# Builder stage
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Build arguments (optional, for URLs, etc.)
ARG VITE_API_URL
ARG VITE_AUTH_API_URL
ARG VITE_AUTH_SERVICE_URL
ARG VITE_TEAM_API_URL
ARG VITE_VEHICLE_API_URL
ARG VITE_CLIENT_STORE_API_URL

# Inject build-time environment variables for Vite
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL
ENV VITE_TEAM_API_URL=$VITE_TEAM_API_URL
ENV VITE_VEHICLE_API_URL=$VITE_VEHICLE_API_URL
ENV VITE_CLIENT_STORE_API_URL=$VITE_CLIENT_STORE_API_URL

# Build the app
RUN npm run build

# -----------------------------
# Production stage
# -----------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copy build output from builder stage
COPY --from=builder /app/dist ./dist

# Install a simple static file server
RUN npm install -g serve

# Expose port
EXPOSE 3003

# Serve the built static files
CMD ["serve", "-s", "dist", "-l", "3003"]
