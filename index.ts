import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import cron from "node-cron";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { JSDOM } from "jsdom";

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
const HISTORY_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "guild_data.json"
);

// Initialize history file if it doesn't exist
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

function parseGuildHTML(html) {
  const members = [];
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const onlineStatusCells = document.querySelectorAll("td.onlinestatus");

  onlineStatusCells.forEach((statusCell) => {
    const row = statusCell.parentNode;
    const cells = Array.from(row.querySelectorAll("td"));

    if (cells.length >= 6) {
      const titleCell = cells[0];
      const nameCell = cells[1];
      const vocationCell = cells[2];
      const levelCell = cells[3];
      const dateCell = cells[4];

      const title = titleCell.textContent.trim();
      const nameLink = nameCell.querySelector("a");
      const name = nameLink ? nameLink.textContent.trim() : "";
      const vocation = vocationCell.textContent.trim();
      const level = parseInt(levelCell.textContent.trim(), 10);
      const dateJoined = dateCell.textContent.trim();
      const status = statusCell.textContent.trim();

      members.push({
        name,
        title,
        vocation,
        level,
        dateJoined,
        status,
      });
    }
  });

  return members;
}

async function scrapeGuildData() {
  console.log("Starting guild data scraping...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    });

    await page.setJavaScriptEnabled(true);

    console.log("Navigating to guild page...");
    await page.goto(
      "https://rubinot.com.br/?subtopic=guilds&page=view&GuildName=Resonance",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const pageTitle = await page.title();
    if (
      pageTitle.includes("Attention Required") ||
      pageTitle.includes("403 Forbidden")
    ) {
      console.error("Blocked by Cloudflare! Could not access the page.");
      return false;
    }

    console.log("Extracting guild data...");
    const content = await page.content();
    const members = parseGuildHTML(content);

    if (members.length === 0) {
      console.error("No members found in the parsed HTML.");
      return false;
    }

    // Read existing data
    const historicalData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));

    // Add new snapshot
    const newSnapshot = {
      lastUpdated: new Date().toISOString(),
      members: members,
    };

    historicalData.push(newSnapshot);

    // Save updated history
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historicalData, null, 2));

    console.log(`Scraping complete. Found ${members.length} guild members.`);
    return true;
  } catch (error) {
    console.error("Error scraping guild data:", error);
    return false;
  } finally {
    await browser.close();
  }
}

cron.schedule("0 13 * * *", async () => {
  console.log("Running scheduled guild data update...");
  await scrapeGuildData();
});

app.get("/api/guild", (req, res) => {
  const historicalData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  const latestSnapshot = historicalData[historicalData.length - 1];

  res.json({
    guildName: "Resonance",
    lastUpdated: latestSnapshot.lastUpdated,
    totalMembers: latestSnapshot.members.length,
    members: latestSnapshot.members,
  });
});

app.get("/api/get-player-level", (req, res) => {
  const playerName = req.query.name;

  if (!playerName) {
    return res.status(400).json({ error: "Player name is required" });
  }

  const historicalData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  const latestSnapshot = historicalData[historicalData.length - 1];

  const player = latestSnapshot.members.find(
    (m) => m.name.toLowerCase() === playerName.toLowerCase()
  );

  if (!player) {
    return res.status(404).json({
      error: "Player not found",
      fetchDate: latestSnapshot.lastUpdated,
    });
  }

  res.json({
    name: player.name,
    level: player.level,
    fetchDate: latestSnapshot.lastUpdated,
  });
});

app.get("/api/refresh", async (req, res) => {
  const success = await scrapeGuildData();
  if (success) {
    res.json({
      status: "success",
      message: "Guild data updated successfully",
    });
  } else {
    res
      .status(500)
      .json({ status: "error", message: "Failed to update guild data" });
  }
});

app.listen(PORT, () => {
  console.log(`Guild data API server running on port ${PORT}`);
  scrapeGuildData();
});
