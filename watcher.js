import fs from "fs";
import path from "path";
import os from "os";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

// Load variables from .env
const LOG_DIR = process.env.LOG_DIR || "/root/.pm2/logs/";
const CACHE_DIR = process.env.CACHE_DIR || "/opt/pm2-watcher/cache/";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || "10000");

const HOST = os.hostname();
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Pick newest error log modified today
function getNewestTodayLog() {
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith("-error.log"));
  const todayDate = today();

  const logs = files
    .map(f => {
      const full = path.join(LOG_DIR, f);
      const stat = fs.statSync(full);
      return {
        name: f,
        full,
        mtime: stat.mtime,
        date: stat.mtime.toISOString().slice(0, 10),
      };
    })
    .filter(x => x.date === todayDate);

  if (logs.length === 0) return null;

  logs.sort((a, b) => b.mtime - a.mtime);
  return logs[0];
}

async function sendTelegram(app, lines) {
  if (lines.length === 0) return;

  let text =
`🚨 *${app}* New Error  
🖥 Host: *${HOST}*  
📅 Date: ${today()}

${lines.map(l => `• ${l}`).join("\n")}`;

// ambil maksimal 4000 karakter
if (text.length > 4000) text = text.slice(0, 4000) + "\n…(truncated)";

  await bot.sendMessage(CHAT_ID, text, { parse_mode: "Markdown" });
}

function monitor() {
  const target = getNewestTodayLog();
  if (!target) return;

  const appName = target.name.replace("-error.log", "");
  const offsetFile = path.join(CACHE_DIR, `${appName}-${today()}.offset`);

  // load last offset
  let lastOffset = 0;
  if (fs.existsSync(offsetFile)) {
    lastOffset = parseInt(fs.readFileSync(offsetFile, "utf8")) || 0;
  }

  const stat = fs.statSync(target.full);
  if (stat.size < lastOffset) {
    // log rotated
    lastOffset = 0;
  }

  const fd = fs.openSync(target.full, "r");
  const buf = Buffer.alloc(stat.size - lastOffset);

  fs.readSync(fd, buf, 0, buf.length, lastOffset);
  fs.closeSync(fd);

  const newContent = buf.toString("utf8");

  const lines = newContent
    .split("\n")
    .filter(x => x.toLowerCase().includes("error"));

  if (lines.length > 0) {
    sendTelegram(appName, lines);
  }

  // save new offset
  fs.writeFileSync(offsetFile, stat.size.toString());
}

console.log(`📡 Log watcher running on ${HOST}...`);

setInterval(monitor, INTERVAL_MS);