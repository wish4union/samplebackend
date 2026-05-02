// ─────────────────────────────────────────────────────────────────────────────
//  UpcomingList.jsx
//  Fetches and displays staff members with birthdays in the next 7 days.
//  Uses BirthdayCard for each member (isToday=false, shows daysUntil).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import BirthdayCard from "./BirthdayCard";

function UpcomingList() {
  const [upcoming, setUpcoming] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res  = await fetch("/birthdays/upcoming?days=7");
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        // Sort by daysUntil ascending so the nearest birthdays appear first
        const sorted = (data.staff || []).sort((a, b) => a.daysUntil - b.daysUntil);
        setUpcoming(sorted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUpcoming();
  }, []);

  if (loading) {
    return (
      <div className="section">
        <h2 className="section__title">📅 Upcoming Birthdays (next 7 days)</h2>
        <div className="skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h2 className="section__title">📅 Upcoming Birthdays</h2>
        <div className="error-banner">⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section__header">
        <h2 className="section__title">📅 Upcoming Birthdays</h2>
        <span className="section__badge">next 7 days · {upcoming.length} found</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__emoji">🌸</div>
          <p>No upcoming birthdays in the next 7 days.</p>
        </div>
      ) : (
        <div className="card-list">
          {upcoming.map((member) => (
            <BirthdayCard key={member.id} member={member} isToday={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingList;
