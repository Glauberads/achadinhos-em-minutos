# ============================================
# STAGE 1: Install dependencies & build
# ============================================
FROM node:24-slim AS build

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Public browser configuration. Never add server-side secrets here: every
# VITE_* value is embedded in the generated JavaScript bundle.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

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
