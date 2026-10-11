# Stage 1: Base & Production Dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies needed for native modules (e.g., bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Final minimal production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000

# Security: run application as non-root user
USER node

# Copy node_modules from base stage
COPY --chown=node:node --from=base /app/node_modules ./node_modules
COPY --chown=node:node . .

# Ensure static & logs directories are created with proper permissions
RUN mkdir -p static logs

EXPOSE 9000

CMD ["node", "index.js"]
