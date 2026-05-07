// ─────────────────────────────────────────────────────────────────────────────
//  birthdayUtils.js  –  Date comparison helpers
// ─────────────────────────────────────────────────────────────────────────────

const staff = require("./staff");

/**
 * Returns today's date as "MM-DD" string in local time.
 */
function getTodayMMDD() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day   = String(now.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

/**
 * Returns an array of staff whose birthday is today.
 */
function getTodayBirthdays() {
  const today = getTodayMMDD();
  return staff.filter((s) => s.birthday === today);
}

/**
 * Returns staff whose birthday falls within the next `days` days
 * (not including today).
 * @param {number} days – look-ahead window (default 7)
 */
function getUpcomingBirthdays(days = 7) {
  const now  = new Date();
  const year = now.getFullYear();

  return staff.filter((s) => {
    const [month, day] = s.birthday.split("-").map(Number);

    // Build a Date for the birthday this calendar year
    let bdayDate = new Date(year, month - 1, day);

    // If the birthday already passed this year, check next year
    if (bdayDate <= now) {
      bdayDate = new Date(year + 1, month - 1, day);
    }

    // Difference in full days (strip time)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs   = bdayDate - todayMidnight;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Include birthdays strictly in 1..days range (today is handled separately)
    return diffDays > 0 && diffDays <= days;
  }).map((s) => {
    // Attach a human-readable "daysUntil" field for the frontend
    const [month, day] = s.birthday.split("-").map(Number);
    let bdayDate = new Date(year, month - 1, day);
    if (bdayDate <= now) bdayDate = new Date(year + 1, month - 1, day);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysUntil = Math.floor((bdayDate - todayMidnight) / (1000 * 60 * 60 * 24));
    return { ...s, daysUntil };
  });
}

/**
 * Finds a single staff member by name (case-insensitive).
 * Returns undefined if not found.
 */
function getStaffByName(name) {
  return staff.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
}

module.exports = { getTodayBirthdays, getUpcomingBirthdays, getStaffByName, getTodayMMDD };
