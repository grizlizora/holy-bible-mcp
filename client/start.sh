#!/usr/bin/env bash

# Liquid AI One-Click System Launcher

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "============================================="
echo "🌊 Launching Liquid AI System..."
echo "============================================="

# 1. Check Node modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 2. Check if Ollama is installed / running
if command -v ollama &> /dev/null; then
    echo "🦙 Checking Ollama local AI server..."
    if ! pgrep -x "ollama" > /dev/null; then
        echo "⚡ Starting Ollama service in background..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
else
    echo "ℹ️ Ollama not found. System will fallback to Cloud OpenAI API."
fi

# 3. Build & Start Dev Server
echo "🚀 Starting Next.js Web Server..."
npm run dev
