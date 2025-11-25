# PM2 Log Watcher -- Telegram Error Notifier

A lightweight Node.js utility that monitors **PM2 error logs** and sends
**real-time notifications to Telegram** whenever new errors appear.\
Built for servers running many PM2 apps, making it easy to catch issues
instantly without manually checking logs.

## 🔍 What This Tool Does

-   Monitors the **newest PM2 `*-error.log` file** that was modified
    **today**
-   Detects **only newly added error lines** (not the whole file)
-   Remembers the last read position using an **offset file**
-   Sends formatted alerts to Telegram, including:
    -   App name\
    -   Hostname\
    -   Timestamp\
    -   Error lines (auto-truncated if too long)
-   Auto-creates cache directory for offsets
-   Uses `.env` for configuration
-   Safe for long logs (cuts off at \~4000 characters to avoid Telegram
    limit)

## 🧩 How It Works

1.  Every interval (default 5 seconds), the watcher:

    -   Looks at PM2 error logs (`*-error.log`)
    -   Picks the newest log modified **today**
    -   Reads only the section added since the last scan
    -   Filters lines containing `"error"`
    -   Sends the first \~4000 characters to Telegram

2.  Offset is stored in:

        /opt/pm2-watcher/cache/{app}-{YYYY-MM-DD}.offset

3.  If log rotates or shrinks, offset resets automatically.

## ⚙️ Environment Variables

Configure via `.env`:

    LOG_DIR=/root/.pm2/logs/
    CACHE_DIR=/opt/pm2-watcher/cache/
    BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
    CHAT_ID=YOUR_CHAT_ID
    INTERVAL_MS=5000

## 🚀 Run

    node watcher.js

Or with PM2:

    pm2 start watcher.js --name pm2-watcher

## 📦 Dependencies

-   Node.js (ESM)
-   node-telegram-bot-api\
-   dotenv

## 🛡️ Why Use This?

-   No need to SSH into the server to check PM2 logs\
-   Instant Telegram alerts for new errors\
-   Zero-downtime monitoring\
-   Simple, fast, and minimal resource usage\
-   Maintains daily offsets automatically
