#!/usr/bin/env bash

# Liquid AI & Telegram Bot Full System Launcher
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "============================================="
echo "🌊 Launching Liquid AI & Telegram Bot System..."
echo "============================================="

# 1. Kill old processes to prevent port conflicts
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4040 | xargs kill -9 2>/dev/null || true
killall ngrok 2>/dev/null || true

# 2. Check Ollama
if command -v ollama &> /dev/null; then
    echo "🦙 Checking Ollama local AI server..."
    if ! pgrep -x "ollama" > /dev/null; then
        echo "⚡ Starting Ollama service in background..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
fi

# 3. Start Ngrok Tunnel
if command -v ngrok &> /dev/null; then
    echo "🌐 Starting Ngrok Tunnel on port 3000..."
    ngrok http 3000 > /dev/null 2>&1 &
    echo "⏳ Waiting for Ngrok to connect..."
    sleep 3
    
    # Fetch public URL
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app' | head -n 1)
    
    if [ ! -z "$NGROK_URL" ]; then
        echo "✅ Ngrok URL acquired: $NGROK_URL"
        
        # Update .env in telegram-bot
        ENV_FILE="$SCRIPT_DIR/telegram-bot/.env"
        if [ -f "$ENV_FILE" ]; then
            if grep -q "WEBAPP_URL=" "$ENV_FILE"; then
                sed -i '' "s|^WEBAPP_URL=.*|WEBAPP_URL=$NGROK_URL|" "$ENV_FILE" 2>/dev/null || sed -i "s|^WEBAPP_URL=.*|WEBAPP_URL=$NGROK_URL|" "$ENV_FILE"
            else
                echo "WEBAPP_URL=$NGROK_URL" >> "$ENV_FILE"
            fi
            echo "🔄 Updated Telegram Bot WEBAPP_URL automatically."
        fi
    else
        echo "⚠️ Failed to get Ngrok URL. Proceeding without auto-update."
    fi
else
    echo "⚠️ Ngrok is not installed. Skipping tunnel setup."
fi

# 4. Start Telegram Bot in background
echo "🤖 Starting Telegram Bot Engine..."
cd "$SCRIPT_DIR/telegram-bot"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Telegram Bot dependencies..."
    npm install
fi
npm run start > "$SCRIPT_DIR/telegram-bot.log" 2>&1 &
BOT_PID=$!
echo "✅ Telegram Bot running (PID: $BOT_PID). Logs at telegram-bot.log"

# 5. Start Next.js Web Server
echo "🚀 Starting Next.js Web Server..."
cd "$SCRIPT_DIR/client"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Web App dependencies..."
    npm install
fi
npm run dev
