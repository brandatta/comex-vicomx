# ---- build client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- build server ----
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/ ./

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# server code + deps
COPY --from=server-build /app/server /app/server
# client dist into server public
COPY --from=client-build /app/client/dist /app/server/public

EXPOSE 8080
CMD ["node", "server/src/index.js"]
