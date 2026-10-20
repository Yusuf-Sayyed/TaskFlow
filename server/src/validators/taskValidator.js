const { DEPARTMENTS } = require('../models/Employee');
const { TASK_PRIORITIES, TASK_STATUSES } = require('../models/Task');
const { BadRequestError } = require('../utils/errors');
const { isDateOrderValid } = require('../utils/dateUtils');

function validateCreateTask(req, res, next) {
  const { title, department, priority, startDate, dueDate, status, completedDate } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({ field: 'title', message: 'Task title is required' });
  }

  if (!department) {
    errors.push({ field: 'department', message: 'Department is required' });
  } else if (!DEPARTMENTS.includes(department)) {
    errors.push({ field: 'department', message: `Department must be one of: ${DEPARTMENTS.join(', ')}` });
  }

  if (priority && !TASK_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` });
  }

  if (!startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  } else if (isNaN(new Date(startDate).getTime())) {
    errors.push({ field: 'startDate', message: 'Invalid start date' });
  }

  if (!dueDate) {
    errors.push({ field: 'dueDate', message: 'Due date is required' });
  } else if (isNaN(new Date(dueDate).getTime())) {
    errors.push({ field: 'dueDate', message: 'Invalid due date' });
  }

  if (startDate && dueDate && !isDateOrderValid(startDate, dueDate)) {
    errors.push({ field: 'dueDate', message: 'Due date cannot be earlier than start date' });
  }

  // Initial status check: New tasks must always start with Todo.
  if (status && status !== 'Todo') {
    errors.push({ field: 'status', message: 'New tasks must always start with Todo status' });
  }

  if (completedDate !== undefined) {
    errors.push({ field: 'completedDate', message: 'Client cannot supply completedDate. It is server-generated.' });
  }

  if (errors.length > 0) {
    return next(new BadRequestError(errors.map((e) => e.message).join('; '), errors));
  }

  req.body.title = title.trim();
  if (req.body.description) req.body.description = req.body.description.trim();
  req.body.status = 'Todo';
  delete req.body.taskId;
  delete req.body.completedDate;

  next();
}

function validateUpdateTask(req, res, next) {
  const { title, department, priority, startDate, dueDate, status, completedDate } = req.body;
  const errors = [];

  // Rule 3: Reject status change via standard update
  if (status !== undefined) {
    return next(
      new BadRequestError(
        'Status cannot be updated through this endpoint. Use PUT /api/tasks/:id/status instead.'
      )
    );
  }

  // Rule 4: Reject client-supplied completedDate
  if (completedDate !== undefined) {
    return next(
      new BadRequestError(
        'Client cannot supply completedDate. It is server-managed on status transitions.'
      )
    );
  }

  // Remove taskId if present
  delete req.body.taskId;

  if (title !== undefined && (!title || typeof title !== 'string' || !title.trim())) {
    errors.push({ field: 'title', message: 'Task title cannot be empty' });
  }

  if (department !== undefined && !DEPARTMENTS.includes(department)) {
    errors.push({ field: 'department', message: `Department must be one of: ${DEPARTMENTS.join(', ')}` });
  }

  if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` });
  }

  if (startDate !== undefined && isNaN(new Date(startDate).getTime())) {
    errors.push({ field: 'startDate', message: 'Invalid start date' });
  }

  if (dueDate !== undefined && isNaN(new Date(dueDate).getTime())) {
    errors.push({ field: 'dueDate', message: 'Invalid due date' });
  }

  if (startDate && dueDate && !isDateOrderValid(startDate, dueDate)) {
    errors.push({ field: 'dueDate', message: 'Due date cannot be earlier than start date' });
  }

  if (errors.length > 0) {
    return next(new BadRequestError(errors.map((e) => e.message).join('; '), errors));
  }

  if (req.body.title) req.body.title = req.body.title.trim();
  if (req.body.description !== undefined) req.body.description = req.body.description.trim();

  next();
}

function validateTaskStatusTransition(req, res, next) {
  const { status } = req.body;
  if (!status || !TASK_STATUSES.includes(status)) {
    return next(
      new BadRequestError(
        `Invalid or missing status. Permitted statuses: ${TASK_STATUSES.join(', ')}`
      )
    );
  }
  next();
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateTaskStatusTransition,
};
