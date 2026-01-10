FROM node:20-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Build shared package first, then API
RUN pnpm --filter @puck-arena/shared build
RUN pnpm --filter @puck-arena/api build

WORKDIR /app/packages/api

EXPOSE 3001

CMD ["node", "dist/index.js"]
