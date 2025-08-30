FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_URL
ARG VITE_AUTH_API_URL
ARG VITE_AUTH_SERVICE_URL
ARG VITE_TEAM_API_URL
ARG VITE_VEHICLE_API_URL
ARG VITE_CLIENT_STORE_API_URL

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL
ENV VITE_TEAM_API_URL=$VITE_TEAM_API_URL
ENV VITE_VEHICLE_API_URL=$VITE_VEHICLE_API_URL
ENV VITE_CLIENT_STORE_API_URL=$VITE_CLIENT_STORE_API_URL

# Build the application with environment variables
RUN npm run build

# Expose port (matching docker-compose)
EXPOSE 3000

# Start the application in preview mode on port 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
