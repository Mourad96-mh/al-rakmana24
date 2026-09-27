# syntax=docker/dockerfile:1.7
#
# Next + Payload in a single Node process (CLAUDE.md §8). MongoDB Atlas and
# Cloudinary live outside the container, so it holds no state of its own.
#
#   docker compose up -d --build        (see docker-compose.yml, scripts/deploy.sh)

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@11.8.0
WORKDIR /app

# --- Dependencies ------------------------------------------------------------
# strict-dep-builds=false: pnpm 11 makes ERR_PNPM_IGNORED_BUILDS fatal, and
# pnpm-workspace.yaml's allowBuilds still holds pnpm's placeholders. Harmless:
# sharp, esbuild, @swc/core and @parcel/watcher ship prebuilt linux-x64 binaries.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --config.strict-dep-builds=false

# --- Build -------------------------------------------------------------------
# The build needs the real environment: generateStaticParams reads Atlas, and
# NEXT_PUBLIC_* values are inlined. The .env arrives as a BuildKit secret, so it
# never lands in a layer — and Next copies .env files into the standalone
# output, hence the rm in the same RUN.
FROM deps AS builder
COPY . .
ENV NEXT_OUTPUT=standalone
RUN --mount=type=secret,id=env,target=/app/.env \
    pnpm build && rm -f .next/standalone/.env*

# --- Tools: create-admin, seed (full node_modules + sources) -----------------
#   docker compose run --rm tools pnpm create-admin
FROM deps AS tools
COPY . .

# --- Runtime -----------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/fr').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
