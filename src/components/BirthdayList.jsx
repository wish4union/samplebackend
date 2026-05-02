// ─────────────────────────────────────────────────────────────────────────────
//  BirthdayList.jsx
//  Fetches and displays staff members whose birthday is TODAY.
//  Uses BirthdayCard for each member.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import BirthdayCard from "./BirthdayCard";

function BirthdayList() {
  const [birthdays, setBirthdays] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Fetch today's birthdays from the backend on mount
  useEffect(() => {
    async function fetchTodayBirthdays() {
      try {
        const res  = await fetch("/birthdays/today");
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setBirthdays(data.staff || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTodayBirthdays();
  }, []);

  if (loading) {
    return (
      <div className="section">
        <h2 className="section__title">🎂 Today's Birthdays</h2>
        <div className="skeleton-list">
          {[1, 2].map((i) => <div key={i} className="skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h2 className="section__title">🎂 Today's Birthdays</h2>
        <div className="error-banner">
          ⚠️ Could not load data: {error}
          <br />
          <small>Make sure the backend is running on port 5000.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section__header">
        <h2 className="section__title">🎂 Today's Birthdays</h2>
        <span className="section__badge section__badge--hot">
          {birthdays.length} today
        </span>
      </div>

      {birthdays.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__emoji">🎈</div>
          <p>No birthdays today – check back tomorrow!</p>
        </div>
      ) : (
        <div className="card-list">
          {birthdays.map((member) => (
            <BirthdayCard key={member.id} member={member} isToday={true} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BirthdayList;
