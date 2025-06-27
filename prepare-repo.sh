#!/bin/bash
# Preparation script for mcp-audio-tweaker

echo "⚙️ Preparing mcp-audio-tweaker for repository..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Check package.json
echo "📋 Package info:"
npm list --depth=0

echo "✅ mcp-audio-tweaker is ready for Git!"
echo ""
echo "Next steps:"
echo "1. git init"
echo "2. git add ."
echo "3. git commit -m 'Initial commit: MCP Audio Tweaker v0.1.0'"
echo "4. git remote add origin https://github.com/DeveloperZo/mcp-audio-tweaker.git"
echo "5. git push -u origin main"
