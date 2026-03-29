FROM node:24-alpine AS builder


RUN npm install -g pnpm

WORKDIR /app


COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./


COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/


RUN pnpm install --frozen-lockfile


RUN pnpm --filter @workspace/api-server run build


FROM node:24-alpine AS runner

WORKDIR /app


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules


EXPOSE 3000

ENV NODE_ENV=production


CMD ["node", "artifacts/api-server/dist/index.cjs"]
