const Counter = require('../models/Counter');

/**
 * Atomically generates next sequential ID with a given prefix.
 * e.g., 'EMP' -> 'EMP-0001', 'TSK' -> 'TSK-0001'
 */
async function getNextSequence(name, prefix, digits = 4) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(digits, '0');
  return `${prefix}-${seqStr}`;
}

async function getNextEmployeeId() {
  return getNextSequence('employee', 'EMP', 4);
}

async function getNextTaskId() {
  return getNextSequence('task', 'TSK', 4);
}

module.exports = {
  getNextSequence,
  getNextEmployeeId,
  getNextTaskId,
};
