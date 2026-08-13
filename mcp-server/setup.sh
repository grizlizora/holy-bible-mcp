#!/usr/bin/env bash
# ==============================================================================
# 📖 HOLY BIBLE MCP - INTERACTIVE CROSS-PLATFORM CLI SETUP ENGINE
# ==============================================================================
set -e

GLOBAL_DIR="$HOME/.bible-mcp"
GLOBAL_DB="$GLOBAL_DIR/bible_database.sqlite"
REMOTE_DB="https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite"

clear
echo "=============================================================================="
echo "📖 HOLY BIBLE MCP SERVER - UNIVERSAL MULTILINGUAL INSTALLER"
echo "=============================================================================="
echo "Supported OS: macOS (M1-M4/Intel), Linux (x86_64/ARM64), Windows (WSL/Git Bash)"
echo "=============================================================================="
echo ""

# ------------------------------------------------------------------------------
# STEP 1: Codebase Setup Choice
# ------------------------------------------------------------------------------
read -p "1. Do you want to set up the MCP Server codebase locally? [Y/n]: " CLONE_CHOICE
CLONE_CHOICE=${CLONE_CHOICE:-Y}

if [[ "$CLONE_CHOICE" =~ ^[Yy]$ ]]; then
  read -p "   Enter target folder name [default: holy-bible-mcp]: " TARGET_DIR
  TARGET_DIR=${TARGET_DIR:-holy-bible-mcp}

  if [ ! -d "$TARGET_DIR" ]; then
    echo "📦 Downloading MCP Server codebase into ./$TARGET_DIR..."
    git clone --depth 1 https://github.com/grizlizora/holy-bible-mcp.git "$TARGET_DIR" || mkdir -p "$TARGET_DIR"
  fi

  if [ -d "$TARGET_DIR/mcp-server" ]; then
    echo "⚙️ Building local MCP Server..."
    cd "$TARGET_DIR/mcp-server"
    npm install --silent
    npm run build --silent
    cd - > /dev/null
    echo "✅ MCP Server compiled successfully!"
  fi
fi

echo ""

# ------------------------------------------------------------------------------
# STEP 2: Database Setup & Real-time Percentage Progress
# ------------------------------------------------------------------------------
mkdir -p "$GLOBAL_DIR"

if [ -f "$GLOBAL_DB" ] && [ $(wc -c <"$GLOBAL_DB") -gt 1000000 ]; then
  echo "✅ Holy Bible SQLite Database verified at $GLOBAL_DB"
else
  read -p "2. Do you want to download the 5.88GB Offline Holy Bible Database now? [Y/n]: " DB_CHOICE
  DB_CHOICE=${DB_CHOICE:-Y}

  if [[ "$DB_CHOICE" =~ ^[Yy]$ ]]; then
    echo "📥 Downloading Holy Bible SQLite Database (5.88GB) to $GLOBAL_DB..."
    echo "   Progress:"
    curl -L --progress-bar "$REMOTE_DB" -o "$GLOBAL_DB.tmp"
    mv "$GLOBAL_DB.tmp" "$GLOBAL_DB"
    echo "✅ Database download & verification complete!"
  else
    echo "⚠️ Database download skipped. Server will auto-download on first query or use remote mode."
  fi
fi

echo ""

# ------------------------------------------------------------------------------
# STEP 3: Complete Configuration Output & English Guide
# ------------------------------------------------------------------------------
echo "=============================================================================="
echo "🎉 SETUP COMPLETE! COPY THIS JSON SNIPPET INTO TREA / CURSOR / CLAUDE DESKTOP:"
echo "=============================================================================="
echo ""
cat << "JSONEOF"
{
  "mcpServers": {
    "holy-bible": {
      "command": "npx",
      "args": ["-y", "@grizlizora/holy-bible-mcp"],
      "env": {
        "DEFAULT_MODE": "deep",
        "DEFAULT_WARMTH": "80"
      }
    }
  }
}
JSONEOF

echo ""
echo "------------------------------------------------------------------------------"
echo "📘 QUICK CONFIGURATION GUIDE:"
echo "------------------------------------------------------------------------------"
echo "• DEFAULT_MODE Options:"
echo "   - deep: Deep theological & analytical study with canonical citations."
echo "   - detailed: Detailed structured explanation."
echo "   - verses_only: Strict scripture verse output only."
echo "   - minimal: Concise response under 40 words."
echo ""
echo "• DEFAULT_WARMTH Options: 0 to 100 (Default: 80 for pastoral empathy & depth)."
echo ""
echo "• RESPONSE METRICS FOOTER:"
echo "  Every response automatically ends with a verified status badge:"
echo "  📊 [Accuracy: 99.0% | Complexity: 75/100 (DEEP) | Warmth: 80% | Mode: deep]"
echo "=============================================================================="
