# -------------------------
# 1) Build CLIENT (React / Vite)
# -------------------------
FROM node:20-alpine AS client-build
WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

COPY client/ ./
RUN npm run build


# -------------------------
# 2) SERVER deps (prod only)
# -------------------------
FROM node:20-alpine AS server-deps
WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi


# -------------------------
# 3) Runtime
# -------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app/server

# deps prod
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/package.json server/package-lock.json* ./

# código del server (sin pisar node_modules)
COPY server/ ./

# frontend build
RUN mkdir -p ./public
COPY --from=client-build /app/client/dist ./public

EXPOSE 8080

# tu package.json usa: "start": "node src/index.js"
CMD ["npm", "start"]
