#!/usr/bin/env bash
# ==============================================================================
# Knowledge Atlas — Automated AI Provider / FreeLLMAPI Setup Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "=========================================================="
echo " Knowledge Atlas: AI Provider & FreeLLMAPI Setup"
echo "=========================================================="

# 1. Ensure .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
    else
        touch .env
    fi
fi

# 2. Detect FreeLLMAPI Port & Host
DEFAULT_HOST_PORT="3001"
FREELLMAPI_URL="http://localhost:${DEFAULT_HOST_PORT}"

echo -n "Checking FreeLLMAPI status at ${FREELLMAPI_URL}... "
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${FREELLMAPI_URL}/api/auth/status" || true)

if [ "${STATUS_CODE}" = "200" ] || [ "${STATUS_CODE}" = "404" ]; then
    echo "✓ Reachable (HTTP ${STATUS_CODE})"
else
    echo "✗ Not reachable"
    echo ""
    echo "Attempting to locate local FreeLLMAPI installation..."
    
    POSSIBLE_DIR=""
    if [ -d "${HOME}/freellmapi" ]; then
        POSSIBLE_DIR="${HOME}/freellmapi"
    elif [ -d "${PROJECT_ROOT}/../freellmapi" ]; then
        POSSIBLE_DIR="$(cd "${PROJECT_ROOT}/../freellmapi" && pwd)"
    fi

    if [ -n "${POSSIBLE_DIR}" ]; then
        echo "Found FreeLLMAPI repository at: ${POSSIBLE_DIR}"
        echo "Starting FreeLLMAPI in the background..."
        (
            cd "${POSSIBLE_DIR}"
            if [ -f "docker-compose.yml" ]; then
                docker compose up -d
            elif command -v pnpm &>/dev/null && [ -f "pnpm-lock.yaml" ]; then
                nohup pnpm start > /dev/null 2>&1 &
            elif command -v npm &>/dev/null; then
                nohup npm start > /dev/null 2>&1 &
            fi
        )
        echo "Waiting for FreeLLMAPI to initialize..."
        for i in {1..10}; do
            STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${FREELLMAPI_URL}/api/auth/status" || true)
            if [ "${STATUS_CODE}" = "200" ] || [ "${STATUS_CODE}" = "404" ]; then
                echo "✓ FreeLLMAPI is now running!"
                break
            fi
            sleep 1
        done
    else
        echo "----------------------------------------------------------"
        echo "Notice: FreeLLMAPI is not currently running."
        echo "To use the AI Assistant, please start FreeLLMAPI on port 3001."
        echo "You can start it with:"
        echo "  git clone https://github.com/freellmapi/freellmapi.git ~/freellmapi"
        echo "  cd ~/freellmapi && npm install && npm start"
        echo "----------------------------------------------------------"
    fi
fi

# 3. Discover API Key
DISCOVERED_KEY=""
DB_PATHS=(
    "${HOME}/freellmapi/server/data/freeapi.db"
    "${PROJECT_ROOT}/../freellmapi/server/data/freeapi.db"
)

for db_path in "${DB_PATHS[@]}"; do
    if [ -f "${db_path}" ] && command -v sqlite3 &>/dev/null; then
        VAL=$(sqlite3 "${db_path}" "SELECT value FROM settings WHERE key='unified_api_key' LIMIT 1;" 2>/dev/null || true)
        if [ -n "${VAL}" ]; then
            DISCOVERED_KEY="${VAL}"
            break
        fi
    fi
done

# If existing key in .env, preserve it unless empty
EXISTING_KEY=$(grep -E "^FREELLMAPI_API_KEY=" .env | cut -d '=' -f2- || true)
FINAL_KEY="${EXISTING_KEY:-${DISCOVERED_KEY}}"

# 4. Verify API Key and Model Routing
if [ -n "${FINAL_KEY}" ]; then
    echo -n "Testing API authentication with FreeLLMAPI... "
    AUTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${FINAL_KEY}" "${FREELLMAPI_URL}/v1/models" || true)
    if [ "${AUTH_CHECK}" = "200" ]; then
        echo "✓ Authenticated successfully."
    else
        echo "⚠ Warning: API key returned HTTP ${AUTH_CHECK}"
    fi
else
    echo "ℹ No local FreeLLMAPI API key found. If authentication is enabled, enter it in .env."
fi

# 5. Update .env configuration safely
echo "Writing configuration to .env..."

set_env_var() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${val}|" .env
    else
        echo "${key}=${val}" >> .env
    fi
}

set_env_var "LLM_PROVIDER" "freellmapi"
set_env_var "LLM_MODEL" "auto"
set_env_var "FREELLMAPI_BASE_URL" "http://host.docker.internal:3001"
if [ -n "${FINAL_KEY}" ]; then
    set_env_var "FREELLMAPI_API_KEY" "${FINAL_KEY}"
fi

echo "=========================================================="
echo " AI Setup Complete!"
echo " Provider: FreeLLMAPI (Auto-routing & resilient failover)"
echo " Base URL: http://host.docker.internal:3001"
echo " Recommended model: auto (Qwen, DeepSeek, Gemma, Phi-4)"
echo ""
echo " You can now run:"
echo "   ./scripts/dev.sh"
echo " or:"
echo "   docker compose up -d --build"
echo "=========================================================="
