#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "============================================="
echo "🌊 Launching Liquid AI Workspace..."
echo "============================================="

# 1. Clean up old process on port 3000 if lingering
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 2. Start Ollama local AI server if installed and not running
if command -v ollama &> /dev/null; then
    if ! pgrep -x "ollama" > /dev/null; then
        echo "⚡ Starting Ollama service in background..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
fi

# 3. Start Next.js Web Client
echo "🚀 Starting Next.js Web Server (http://localhost:3000)..."
npm --prefix client run dev
