FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsup.config.ts tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
