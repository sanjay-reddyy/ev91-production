FROM node:20-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g @expo/cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Expo ports
EXPOSE 19000 19001 19002 19006

# Start Expo development server
CMD ["npx", "expo", "start", "--tunnel"]
