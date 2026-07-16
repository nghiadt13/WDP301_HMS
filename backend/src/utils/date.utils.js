/**
 * Parse a positive integer from a string value.
 * @param {*} value - Value to parse
 * @param {number} fallback - Default value if parsing fails
 * @returns {number}
 */
const parsePositiveInteger = (value, fallback = 0) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
};

/**
 * Parse a date string in YYYY-MM-DD format to a Date object.
 * @param {string} value - Date string
 * @returns {Date|null}
 */
const parseDateOnly = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Convert a Date to YYYY-MM-DD string.
 * @param {Date} date
 * @returns {string}
 */
const toDateKey = (date) => date.toISOString().slice(0, 10);

/**
 * Add days to a date.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

/**
 * Get the first day of the month for a given date.
 * @param {Date} date
 * @returns {Date}
 */
const getMonthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

/**
 * Add months to a date.
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
const addMonths = (date, months) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

module.exports = {
  addDays,
  addMonths,
  getMonthStart,
  parseDateOnly,
  parsePositiveInteger,
  toDateKey,
};
