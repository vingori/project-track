#!/usr/bin/env bash
# ==============================================================================
# Zenith Enterprise Governance Hub - Automated Cloud Server Deployment Script
# Target: Any standard Linux/macOS host with Docker & Docker Compose
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo "  Deploying Zenith Enterprise Hub to Production Server  "
echo "========================================================"

# 1. Verify Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env. Please update with your production secrets if needed."
    fi
fi

# 3. Pull latest containers & rebuild application image
echo "📦 Building Zenith standalone production image..."
docker compose build --pull

# 4. Spin up full stack (Zenith App + PostgreSQL + Redis)
echo "🚀 Starting containers..."
docker compose up -d --remove-orphans

# 5. Wait for PostgreSQL and Web App health
echo "⏳ Waiting for application health check on http://localhost:3000/api/health..."
MAX_RETRIES=20
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || true)
    if [ "$HTTP_CODE" = "200" ]; then
        HEALTHY=true
        break
    fi
    sleep 2
    COUNT=$((COUNT + 1))
    echo "  Checking... attempt $COUNT/$MAX_RETRIES (status: $HTTP_CODE)"
done

if [ "$HEALTHY" = true ]; then
    echo "========================================================"
    echo "  ✅ Zenith Enterprise Hub is LIVE & HEALTHY!           "
    echo "  URL: http://localhost:3000                             "
    echo "  Health Check: http://localhost:3000/api/health         "
    echo "========================================================"
else
    echo "⚠️  Warning: Health check did not return 200 within expected time."
    echo "Inspect logs using: docker compose logs -f zenith-app"
    exit 1
fi
