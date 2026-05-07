require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const morgan = require("morgan");

const {
  getTodayBirthdays,
  getUpcomingBirthdays,
  getStaffByName
} = require("./birthdayUtils");

const { sendBirthdayWish } = require("./messagingService");
const staff = require("./staff");

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(morgan("dev"));

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"]
}));

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Public staff list
app.get("/staff", (_req, res) => {
  const publicList = staff.map(
    ({ id, name, department, birthday, avatar }) => ({
      id,
      name,
      department,
      birthday,
      avatar
    })
  );

  res.json(publicList);
});

// Today's birthdays
app.get("/birthdays/today", (_req, res, next) => {
  try {
    const todayBirthdays = getTodayBirthdays();

    res.json({
      count: todayBirthdays.length,
      date: new Date().toDateString(),
      staff: todayBirthdays
    });
  } catch (err) {
    next(err);
  }
});

// Upcoming birthdays
app.get("/birthdays/upcoming", (req, res, next) => {
  try {
    const parsedDays = parseInt(req.query.days, 10);

    const days =
      Number.isInteger(parsedDays) && parsedDays > 0
        ? parsedDays
        : 7;

    const upcoming = getUpcomingBirthdays(days);

    res.json({
      count: upcoming.length,
      days,
      staff: upcoming
    });
  } catch (err) {
    next(err);
  }
});

// Send birthday wish manually
app.post("/send-wish/:name", async (req, res, next) => {
  try {
    let name;

    try {
      name = decodeURIComponent(req.params.name);
    } catch {
      return res.status(400).json({
        error: "Invalid encoded name"
      });
    }

    const member = getStaffByName(name);

    if (!member) {
      return res.status(404).json({
        error: `Staff member "${name}" not found.`
      });
    }

    const result = await sendBirthdayWish(member);

    res.json({
      message: `Birthday wish sent to ${member.name}`,
      result
    });

  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// Cron Job
// ─────────────────────────────────────────────────────────────

let isCronRunning = false;

cron.schedule(
  "0 9 * * *",
  async () => {
    if (isCronRunning) {
      console.log("[CRON] Previous job still running. Skipping...");
      return;
    }

    isCronRunning = true;

    try {
      console.log(
        `\n[CRON] ${new Date().toLocaleString()} – Checking birthdays...`
      );

      const todayBirthdays = getTodayBirthdays();

      if (todayBirthdays.length === 0) {
        console.log("[CRON] No birthdays today.");
        return;
      }

      console.log(
        `[CRON] Found ${todayBirthdays.length} birthday(s). Sending wishes...`
      );

      for (const member of todayBirthdays) {
        try {
          const result = await sendBirthdayWish(member);

          if (result.allSuccess) {
            console.log(`[CRON] ✓ Wish sent to ${member.name}`);
          } else {
            console.warn(
              `[CRON] ✗ Partial/failed for ${member.name}`,
              result
            );
          }

        } catch (err) {
          console.error(
            `[CRON] Failed for ${member.name}:`,
            err.message
          );
        }
      }

    } finally {
      isCronRunning = false;
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);

console.log(
  "[CRON] Daily birthday scheduler registered – fires at 09:00 IST."
);

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal Server Error"
  });
});

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🎂 Birthday Wishes API running on port ${PORT}`);
  console.log("   GET  /birthdays/today");
  console.log("   GET  /birthdays/upcoming");
  console.log("   POST /send-wish/:name\n");
});

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("\nShutting down server...");

  server.close(() => {
    console.log("Server stopped.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\nServer terminated.");

  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;