FROM oven/bun:1.1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build
RUN bun run build

# Expose port
EXPOSE 4000

# Start
CMD ["bun", "run", "--env-file=.env", "dev"]
