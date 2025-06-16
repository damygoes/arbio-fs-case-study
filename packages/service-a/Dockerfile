# Base image
FROM node:23.11.1-alpine AS base

# Install production dependencies for service-a only
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared-models/package.json ./packages/shared-models/
COPY packages/service-a/package.json ./packages/service-a/
RUN npm ci --omit=dev

# Build all source code
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full monorepo for build context
COPY . .

# Build shared models
WORKDIR /app/packages/shared-models
RUN npm run build

# Build service-a
WORKDIR /app/packages/service-a
RUN npm run build

# Final production image
FROM node:23.11.1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy production deps only
COPY --from=deps /app/node_modules ./node_modules

# Copy built output from builder
COPY --from=builder --chown=nodejs:nodejs /app/packages/service-a/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/service-a/package.json ./package.json

# Run as non-root user
USER nodejs

EXPOSE 3001
CMD ["node", "dist/index.js"]
