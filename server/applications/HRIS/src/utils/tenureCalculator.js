/**
 * Helper to calculate tenure (masa kerja) based on joinDate
 * @param {string|Date} joinDate
 * @param {string|Date} [referenceDate] Defaults to today
 * @returns {{ years: number, months: number, days: number, formatted: string }}
 */
function calculateTenure(joinDate, referenceDate = new Date()) {
  if (!joinDate) {
    return { years: 0, months: 0, days: 0, formatted: '-' };
  }

  const start = new Date(joinDate);
  const end = new Date(referenceDate);

  if (isNaN(start.getTime())) {
    return { years: 0, months: 0, days: 0, formatted: '-' };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0) parts.push(`${months} Bulan`);
  if (days > 0 || parts.length === 0) parts.push(`${days} Hari`);

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    formatted: parts.join(' ')
  };
}

module.exports = { calculateTenure };
