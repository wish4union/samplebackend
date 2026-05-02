// ─────────────────────────────────────────────────────────────────────────────
//  BirthdayCard.jsx
//  Displays a single staff member's birthday card.
//  Includes a "Send Wish" button that calls POST /send-wish/:name via the API.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";

const DEPARTMENT_COLORS = {
  Engineering: { bg: "#e8f4fd", accent: "#2196F3" },
  Design:      { bg: "#fce4ec", accent: "#e91e63" },
  Marketing:   { bg: "#f3e5f5", accent: "#9c27b0" },
  HR:          { bg: "#e8f5e9", accent: "#4caf50" },
  Finance:     { bg: "#fff3e0", accent: "#ff9800" },
  Sales:       { bg: "#fafafa", accent: "#607d8b" },
  Product:     { bg: "#e0f7fa", accent: "#00bcd4" },
};

function BirthdayCard({ member, isToday = false }) {
  // Track the send state: idle | loading | success | error
  const [sendState, setSendState] = useState("idle");
  const [resultMsg, setResultMsg] = useState("");

  const colors = DEPARTMENT_COLORS[member.department] || { bg: "#f5f5f5", accent: "#555" };

  // Formats "MM-DD" → "April 22" style
  function formatBirthday(mmdd) {
    const [month, day] = mmdd.split("-").map(Number);
    return new Date(2000, month - 1, day).toLocaleDateString("en-US", {
      month: "long",
      day:   "numeric"
    });
  }

  // Calls backend POST /send-wish/:name
  async function handleSendWish() {
    setSendState("loading");
    setResultMsg("");
    try {
      const res = await fetch(
        `/send-wish/${encodeURIComponent(member.name)}`,
        { method: "POST" }
      );
      const data = await res.json();

      if (res.ok) {
        setSendState("success");
        const isDemoMode = data.result?.demo;
        setResultMsg(
          isDemoMode
            ? "✓ Demo mode – wish logged (configure API keys to send for real)"
            : "✓ WhatsApp & Email sent successfully!"
        );
      } else {
        setSendState("error");
        setResultMsg(`✗ ${data.error || "Something went wrong"}`);
      }
    } catch (err) {
      setSendState("error");
      setResultMsg("✗ Network error – is the backend running?");
    }

    // Reset button after 4 s
    setTimeout(() => {
      setSendState("idle");
      setResultMsg("");
    }, 4000);
  }

  return (
    <div className={`birthday-card ${isToday ? "birthday-card--today" : ""}`}>
      {/* Coloured left bar based on department */}
      <div className="birthday-card__bar" style={{ background: colors.accent }} />

      <div className="birthday-card__content">
        {/* Avatar */}
        <div
          className="birthday-card__avatar"
          style={{ background: colors.bg, color: colors.accent }}
        >
          {member.avatar}
        </div>

        {/* Info */}
        <div className="birthday-card__info">
          <div className="birthday-card__name">{member.name}</div>
          <div className="birthday-card__meta">
            <span
              className="birthday-card__dept"
              style={{ background: colors.bg, color: colors.accent }}
            >
              {member.department}
            </span>
            <span className="birthday-card__date">
              🎂 {formatBirthday(member.birthday)}
            </span>
            {member.daysUntil !== undefined && (
              <span className="birthday-card__days">
                in {member.daysUntil} day{member.daysUntil !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Result message */}
          {resultMsg && (
            <div className={`birthday-card__result birthday-card__result--${sendState}`}>
              {resultMsg}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          className={`birthday-card__btn birthday-card__btn--${sendState}`}
          onClick={handleSendWish}
          disabled={sendState === "loading"}
        >
          {sendState === "loading" && <span className="spinner" />}
          {sendState === "idle"    && "Send Wish"}
          {sendState === "loading" && "Sending…"}
          {sendState === "success" && "Sent ✓"}
          {sendState === "error"   && "Retry"}
        </button>
      </div>
    </div>
  );
}

export default BirthdayCard;
