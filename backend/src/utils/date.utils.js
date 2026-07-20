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
 * @param {string|Date} value - Date string or object
 * @returns {Date|null}
 */
const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Parse a hotel check-in date (or date string YYYY-MM-DD).
 * @param {string|Date} value
 * @returns {Date|null}
 */
const parseHotelCheckInDate = (value) => parseDateOnly(value);

/**
 * Parse a hotel check-out date (or date string YYYY-MM-DD).
 * @param {string|Date} value
 * @returns {Date|null}
 */
const parseHotelCheckOutDate = (value) => parseDateOnly(value);

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
  parseHotelCheckInDate,
  parseHotelCheckOutDate,
  parsePositiveInteger,
  toDateKey,
};
