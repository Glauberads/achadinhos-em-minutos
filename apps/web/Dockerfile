# ============================================
# STAGE 1: Install dependencies & build
# ============================================
FROM node:24-slim AS build

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy sub-package manifests
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web/ apps/web/
COPY packages/shared/ packages/shared/

# Build Vite SPA
RUN cd apps/web && pnpm build

# ============================================
# STAGE 2: Production (nginx)
# ============================================
FROM nginx:alpine AS runtime

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from build stage
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
