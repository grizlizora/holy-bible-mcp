#!/bin/bash

echo "========================================="
echo "   Bible Telegram Bot - Setup & Start    "
echo "========================================="

# 1. Ask for API keys if .env is missing or empty
if [ ! -f .env ] || ! grep -q "API_KEY" .env; then
    echo "First time setup. Let's configure your keys."
    read -p "Enter your TELEGRAM_BOT_TOKEN: " tg_token
    echo ""
    echo "Choose Provider:"
    echo "1) Google AI Studio API Key (Recommended, free 15 requests/min, starts with AIzaSy...)"
    echo "2) OpenRouter API Key (starts with sk-or-v1-...)"
    read -p "Enter your API Key (Google AI Studio or OpenRouter): " api_key
    
    echo "TELEGRAM_BOT_TOKEN=$tg_token" > .env
    echo "API_KEY=$api_key" >> .env
    echo "Keys saved to .env file."
    echo "-----------------------------------------"
fi

# 2. Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# 3. Start the bot using npm start
echo "Starting the bot..."
npm start
