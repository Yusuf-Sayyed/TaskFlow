/**
 * Date utility functions for consistent timezone and calendar-day operations.
 */

// Format any valid date to 'YYYY-MM-DD'
function toDayString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Checks if targetDate is within [startDate, endDate] inclusively by calendar day.
 */
function isDateWithinInclusive(targetDate, startDate, endDate) {
  const targetStr = toDayString(targetDate);
  const startStr = toDayString(startDate);
  const endStr = toDayString(endDate);

  if (!targetStr || !startStr || !endStr) return false;
  return targetStr >= startStr && targetStr <= endStr;
}

/**
 * Checks if task is overdue based on due date and status.
 * A task is overdue when its dueDate day is strictly earlier than the current day,
 * and status is NOT 'Completed' and NOT 'Cancelled'.
 */
function isTaskOverdue(dueDate, status, currentDate = new Date()) {
  if (status === 'Completed' || status === 'Cancelled') {
    return false;
  }
  const dueStr = toDayString(dueDate);
  const currentStr = toDayString(currentDate);

  if (!dueStr || !currentStr) return false;
  return dueStr < currentStr;
}

/**
 * Validates that dueDate is not earlier than startDate (by calendar day).
 */
function isDateOrderValid(startDate, dueDate) {
  const startStr = toDayString(startDate);
  const dueStr = toDayString(dueDate);
  if (!startStr || !dueStr) return true;
  return dueStr >= startStr;
}

module.exports = {
  toDayString,
  isDateWithinInclusive,
  isTaskOverdue,
  isDateOrderValid,
};
