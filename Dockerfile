# -------------------------
# 1) Build CLIENT (Vite/React)
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

# Si tu server tiene build step (TS), dejalo:
# RUN npm run build


# -------------------------
# 3) Runtime (solo prod deps)
# -------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# instalar deps prod del server
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi

# copiar server y build del client
COPY --from=server-build /app/server /app/server
COPY --from=client-build /app/client/dist /app/server/public

# si tu server sirve estáticos desde /public
# (si no, ajustamos el path según tu código)

EXPOSE 8080
CMD ["node", "index.js"]
