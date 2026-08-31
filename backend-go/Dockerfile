# ─── Build stage ───────────────────────────────────────────────────────
FROM golang:1.23-alpine AS builder
WORKDIR /app

# Cache deps
COPY go.mod go.sum ./
RUN go mod download

# Copy source (the build context is backend-go/)
COPY . .

# Build the API binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/api ./cmd/api
# Build the worker binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/worker ./cmd/worker
# Build the migrate binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/migrate ./cmd/migrate

# ─── Runtime stage (distroless for smallest + most secure image) ──────
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app

COPY --from=builder /out/api      /app/api
COPY --from=builder /out/worker   /app/worker
COPY --from=builder /out/migrate  /app/migrate

# The migration files are copied by the deploy pipeline from database/sql/
# at runtime, or baked in here for single-container deploys:
# COPY database/sql /app/database/sql

EXPOSE 4000
USER nonroot

# Default to the API; override CMD for worker or migrate.
CMD ["/app/api"]
