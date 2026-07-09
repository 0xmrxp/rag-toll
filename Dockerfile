# === Stage 1: Install dependencies ===
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# === Stage 2: Production image ===
FROM node:22-slim AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy dependencies & source code
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY bin ./bin
COPY src ./src

# Make CLI executable
RUN chmod +x bin/rag-toll.js

# Expose default port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Default command
ENTRYPOINT ["node", "bin/rag-toll.js"]
CMD ["serve", "./data", "--port", "8080"]
