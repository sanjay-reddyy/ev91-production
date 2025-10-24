FROM node:22.16.0-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl openssl-dev

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# Copy openapi.json into dist
COPY src/openapi.json ./dist/

EXPOSE 4001
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
