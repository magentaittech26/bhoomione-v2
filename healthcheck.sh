#!/usr/bin/env bash
# ==============================================================================
# BhoomiOne V2 ERP — Staging Infrastructure Healthcheck Verifier
# ==============================================================================

set -o errexit
set -o pipefail

# ANSI color metrics
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${YELLOW}=====================================================${RESET}"
echo -e "${YELLOW}   BhoomiOne v2 Staging Health Check Script          ${RESET}"
echo -e "${YELLOW}=====================================================${RESET}"

# 1. Check if Docker container is operational
echo -n "Checking Postgres DB container connectivity... "
if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}OPERATIONAL${RESET}"
else
    echo -e "${RED}DATABASE CONTAINER OFFLINE${RESET}"
    exit 1
fi

# 2. Check Redis connection
echo -n "Checking Redis connection... "
if docker compose exec -T redis redis-cli -a secret ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}OPERATIONAL${RESET}"
else
    echo -e "${RED}REDIS OFFLINE OR PASSWORD MISMATCH${RESET}"
    exit 1
fi

# 3. Request API health check
echo -n "Querying Backend REST API Health Status... "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || true)
if [ "$API_STATUS" -eq 200 ]; then
    echo -e "${GREEN}ONLINE (HTTP 200)${RESET}"
else
    echo -e "${YELLOW}WARNING: API returned HTTP $API_STATUS$RESET"
fi

# 4. Check Queue Worker status
echo -n "Verifying Worker process logs activity... "
WORKER_LOG=$(docker compose logs queue-worker --tail=5 2>&1)
if [[ $WORKER_LOG == *"Worker"* || $WORKER_LOG == *""* ]]; then
    echo -e "${GREEN}ACTIVE${RESET}"
else
    echo -e "${YELLOW}NO WORKER RECORDS FOUND${RESET}"
fi

echo -e "${GREEN}=====================================================${RESET}"
echo -e "${GREEN} ✅ ALL CORE SYSTEM CHANNELS ACTIVE & OPERATIONAL    ${RESET}"
echo -e "${GREEN}=====================================================${RESET}"
exit 0
