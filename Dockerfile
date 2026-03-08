# ─────────────────────────────────────────────────────────────
#  RetiScan API — Dockerfile
#  Multi-stage build: dependencies → production image
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# ── Stage 2: Production image ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S retiscan && adduser -S retiscan -G retiscan

# Copy only what's needed
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ownership
RUN chown -R retiscan:retiscan /app
USER retiscan

EXPOSE 3000

CMD ["node", "app.js"]
