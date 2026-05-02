// ─────────────────────────────────────────────────────────────────────────────
//  App.jsx  –  Root component
//  Renders the dashboard header, summary bar, and the two lists.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import BirthdayList from "./components/BirthdayList";
import UpcomingList from "./components/UpcomingList";
import "./App.css";

function App() {
  // Summary counts shown in the header strip
  const [todayCount,    setTodayCount]    = useState(null);
  const [upcomingCount, setUpcomingCount] = useState(null);
  const [backendOk,     setBackendOk]     = useState(null); // null=checking

  // Check backend health and fetch summary counts
  useEffect(() => {
    async function init() {
      try {
        // Health check
        const health = await fetch("/health");
        setBackendOk(health.ok);

        // Summary counts (fire in parallel)
        const [todayRes, upcomingRes] = await Promise.all([
          fetch("/birthdays/today"),
          fetch("/birthdays/upcoming?days=7")
        ]);
        const todayData    = await todayRes.json();
        const upcomingData = await upcomingRes.json();
        setTodayCount(todayData.count ?? 0);
        setUpcomingCount(upcomingData.count ?? 0);
      } catch {
        setBackendOk(false);
      }
    }
    init();
  }, []);

  // Friendly today's date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">🎂</span>
            <div>
              <h1 className="app-header__title">Birthday Wishes</h1>
              <p className="app-header__subtitle">Staff Birthday Automation Dashboard</p>
            </div>
          </div>
          <div className="app-header__date">{today}</div>
        </div>

        {/* Status strip */}
        <div className="status-strip">
          <div className={`status-pill ${backendOk === null ? "" : backendOk ? "status-pill--green" : "status-pill--red"}`}>
            <span className="status-pill__dot" />
            {backendOk === null ? "Connecting…" : backendOk ? "Backend Online" : "Backend Offline"}
          </div>
          <div className="status-pill status-pill--amber">
            🎂 {todayCount === null ? "–" : todayCount} birthday{todayCount !== 1 ? "s" : ""} today
          </div>
          <div className="status-pill">
            📅 {upcomingCount === null ? "–" : upcomingCount} upcoming this week
          </div>
          <div className="status-pill status-pill--info">
            ⏰ Auto-sends at 9 AM daily
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="app-main">
        {backendOk === false && (
          <div className="offline-banner">
            ⚠️ Cannot reach the backend at <code>localhost:5000</code>.
            Please run <code>npm start</code> inside the <code>backend/</code> folder.
          </div>
        )}

        <div className="dashboard-grid">
          <BirthdayList />
          <UpcomingList />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <p>
          Powered by <strong>Node.js</strong> · <strong>Twilio WhatsApp</strong> ·{" "}
          <strong>SendGrid</strong> · Cron job fires at <em>09:00</em> daily
        </p>
      </footer>
    </div>
  );
}

export default App;
