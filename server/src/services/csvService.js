/**
 * Safe CSV generation with RFC 4180 compliance and Formula Injection Prevention.
 */

// Characters that trigger formula execution in spreadsheet software
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

function sanitizeCellValue(val) {
  if (val === null || val === undefined) {
    return '';
  }

  let str = String(val);

  // If value is a Date instance, format nicely
  if (val instanceof Date) {
    str = val.toISOString().split('T')[0];
  }

  // Prevent Spreadsheet Formula Injection (CSV Injection)
  if (str.length > 0 && FORMULA_TRIGGERS.includes(str.charAt(0))) {
    str = `'${str}`;
  }

  // RFC 4180 escaping: if contains quote, comma, or newline, escape internal quotes and wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate CSV text from array of records and column definitions.
 * @param {Array<Object>} records - Array of data objects
 * @param {Array<{ label: string, key: string | Function }>} columns - Column definitions
 * @returns {string} CSV formatted string
 */
function generateCsv(records, columns) {
  const headerRow = columns.map((col) => sanitizeCellValue(col.label)).join(',');

  const rows = records.map((record) => {
    return columns
      .map((col) => {
        let value;
        if (typeof col.key === 'function') {
          value = col.key(record);
        } else {
          value = record[col.key];
        }
        return sanitizeCellValue(value);
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

module.exports = {
  sanitizeCellValue,
  generateCsv,
};
