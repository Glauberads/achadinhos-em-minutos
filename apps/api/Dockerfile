# ============================================
# STAGE 1: Install dependencies
# ============================================
FROM node:24-slim AS deps

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Copy workspace root files needed for pnpm install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy sub-package manifests (only package.json for layer caching)
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --prod=false

# ============================================
# STAGE 2: Build
# ============================================
FROM node:24-slim AS build

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 

# Copy source code
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/

# Build shared and API
RUN pnpm --filter @achadinhos/shared build
RUN cd apps/api && pnpm run build

# ============================================
# STAGE 3: Production runtime
# ============================================
FROM node:24-slim AS runtime

# Install ffmpeg for video rendering capability
# Using Debian slim so we get glibc-compatible ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

WORKDIR /app

# Copy workspace structure needed at runtime
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Copy built JS output
COPY --from=build /app/apps/api/dist apps/api/dist

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy shared built output
COPY --from=build /app/packages/shared/dist packages/shared/dist

# Copy Knowledge Base files (read at runtime by PromptBuilderService)
COPY docs/marketing/ docs/marketing/

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3001/health/live').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]
