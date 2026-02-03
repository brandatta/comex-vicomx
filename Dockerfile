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
# 2) Build SERVER (Node/Express)
# -------------------------
FROM node:20-alpine AS server-build
WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

COPY server/ ./


# -------------------------
# 3) Runtime
# -------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app/server

# instalar deps prod del server
COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi

# copiar server y frontend build
COPY --from=server-build /app/server /app/server
COPY --from=client-build /app/client/dist /app/server/public

EXPOSE 8080
CMD ["npm", "start"]
