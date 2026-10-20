export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function toInputDateFormat(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

export const ALLOWED_TRANSITIONS = {
  Todo: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export const COUNTRY_OPTIONS = [
  { code: '+1', name: 'United States (+1)', shortName: 'US', format: '(XXX) XXX-XXXX', maxDigits: 10 },
  { code: '+91', name: 'India (+91)', shortName: 'IN', format: 'XXXXX XXXXX', maxDigits: 10 },
  { code: '+44', name: 'United Kingdom (+44)', shortName: 'UK', format: 'XXXX XXXXXX', maxDigits: 10 },
  { code: '+1', name: 'Canada (+1)', shortName: 'CA', format: '(XXX) XXX-XXXX', maxDigits: 10 },
  { code: '+61', name: 'Australia (+61)', shortName: 'AU', format: 'XXX XXX XXX', maxDigits: 9 },
  { code: '+49', name: 'Germany (+49)', shortName: 'DE', format: 'XXX XXXXXXXX', maxDigits: 10 },
  { code: '+33', name: 'France (+33)', shortName: 'FR', format: 'X XX XX XX XX', maxDigits: 9 },
  { code: '+971', name: 'United Arab Emirates (+971)', shortName: 'AE', format: 'XX XXX XXXX', maxDigits: 9 },
  { code: '+65', name: 'Singapore (+65)', shortName: 'SG', format: 'XXXX XXXX', maxDigits: 8 },
  { code: '+81', name: 'Japan (+81)', shortName: 'JP', format: 'XX XXXX XXXX', maxDigits: 10 },
];

export function formatPhoneNumber(digits, format = '(XXX) XXX-XXXX') {
  if (!digits) return '';
  let formatted = '';
  let digitIndex = 0;
  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex++];
    } else {
      formatted += format[i];
    }
  }
  return formatted;
}

