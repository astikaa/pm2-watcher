#!/bin/bash

APP_DIR="/opt/pm2-watcher"
REPO="https://github.com/astikaa/pm2-watcher.git"
ENV_FILE="/opt/pm2-watcher.env"

echo "🚀 Deploying pm2-watcher..."

# Clone repo if not exists
if [ ! -d "$APP_DIR" ]; then
  echo "📥 Cloning repository..."
  git clone "$REPO" "$APP_DIR"
else
  echo "📦 Updating repository..."
  cd "$APP_DIR" || exit
  git pull origin main
fi

cd "$APP_DIR" || exit

echo "📚 Installing dependencies..."
npm install

# Copy env if external env exists
if [ -f "$ENV_FILE" ]; then
  echo "⚙️ Copying environment file..."
  cp "$ENV_FILE" "$APP_DIR/.env"
else
  echo "⚠️ Warning: No env file found at $ENV_FILE"
fi

echo "🔄 Restarting with PM2..."
pm2 delete pm2-watcher >/dev/null 2>&1
pm2 start watcher.js --name pm2-watcher

echo "💾 Saving PM2 auto-start..."
pm2 save
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))

echo "✅ Deployment finished."
