// ─────────────────────────────────────────────────────────────────────────────
//  server.js  –  Express API + node-cron scheduler
//
//  Endpoints:
//    GET  /birthdays/today      → staff with today's birthday
//    GET  /birthdays/upcoming   → staff with birthdays in the next 7 days
//    POST /send-wish/:name      → manually trigger wish for one staff member
//    GET  /staff                → full staff list (handy for testing)
//    GET  /health               → health check
//
//  Cron job fires daily at 09:00 server time and sends wishes to everyone
//  whose birthday is today.
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const cron    = require("node-cron");

const { getTodayBirthdays, getUpcomingBirthdays, getStaffByName } = require("./birthdayUtils");
const { sendBirthdayWish } = require("./messagingService");
const staff = require("./staff");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "https://sample-rho-jade.vercel.app"
  ],
  methods: ["GET", "POST"]
}));

// ─────────────────────────────────────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────────────────────────────────────

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Full staff list
app.get("/staff", (_req, res) => {
  // Omit phone/email from the public list for privacy
  const publicList = staff.map(({ id, name, department, birthday, avatar }) => ({
    id, name, department, birthday, avatar
  }));
  res.json(publicList);
});

// ── GET /birthdays/today ──────────────────────────────────────────────────────
app.get("/birthdays/today", (_req, res) => {
  try {
    const todayBirthdays = getTodayBirthdays();
    res.json({
      count: todayBirthdays.length,
      date:  new Date().toDateString(),
      staff: todayBirthdays
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /birthdays/upcoming ───────────────────────────────────────────────────
app.get("/birthdays/upcoming", (req, res) => {
  try {
    const days     = parseInt(req.query.days) || 7;
    const upcoming = getUpcomingBirthdays(days);
    res.json({
      count: upcoming.length,
      days,
      staff: upcoming
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /send-wish/:name ─────────────────────────────────────────────────────
//  Manually trigger birthday wish for one staff member by name.
//  URL-encode spaces: POST /send-wish/Priya%20Sharma
app.post("/send-wish/:name", async (req, res) => {
  const name   = decodeURIComponent(req.params.name);
  const member = getStaffByName(name);

  if (!member) {
    return res.status(404).json({ error: `Staff member "${name}" not found.` });
  }

  try {
    const result = await sendBirthdayWish(member);
    res.json({
      message: `Birthday wish sent to ${member.name}`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Cron job – runs every day at 09:00 server time
//  Cron syntax: "0 9 * * *"  →  minute=0, hour=9, every day
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule("0 9 * * *", async () => {
  console.log(`\n[CRON] ${new Date().toLocaleString()} – Checking for today's birthdays…`);

  const todayBirthdays = getTodayBirthdays();

  if (todayBirthdays.length === 0) {
    console.log("[CRON] No birthdays today. Nothing to send.");
    return;
  }

  console.log(`[CRON] Found ${todayBirthdays.length} birthday(s) today. Sending wishes…`);

  for (const member of todayBirthdays) {
    const result = await sendBirthdayWish(member);
    if (result.allSuccess) {
      console.log(`[CRON] ✓ Wish sent to ${member.name}`);
    } else {
      console.warn(`[CRON] ✗ Partial/failed for ${member.name}:`, result);
    }
  }
});

console.log("[CRON] Daily birthday scheduler registered – fires at 09:00 every day.");

// ─────────────────────────────────────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎂  Birthday Wishes API running on http://localhost:${PORT}`);
  console.log(`   GET  /birthdays/today`);
  console.log(`   GET  /birthdays/upcoming`);
  console.log(`   POST /send-wish/:name\n`);
});

module.exports = app; // exported for testing
