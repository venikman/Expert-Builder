# Multi-stage build for Expert Builder
# Stage 1: Build with Bun
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including dev)
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Production with .NET 9 SDK and Bun
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS production

# Install Bun
RUN apt-get update && apt-get install -y curl unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Add Bun to PATH
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

WORKDIR /app

# Copy Roslyn runner source and build it
COPY roslyn-runner/ ./roslyn-runner/
RUN dotnet publish ./roslyn-runner/RoslynRunner.csproj \
    -c Release \
    -o /app/roslyn-runner-bin

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV ROSLYN_RUNNER_PATH=/app/roslyn-runner-bin/RoslynRunner

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/lessons || exit 1

# Start the application
CMD ["bun", "dist/index.js"]
