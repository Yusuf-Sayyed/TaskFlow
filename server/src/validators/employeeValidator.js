const { DEPARTMENTS, EMPLOYEE_STATUSES } = require('../models/Employee');
const { BadRequestError } = require('../utils/errors');
const { isDateOrderValid } = require('../utils/dateUtils');

function validateCreateEmployee(req, res, next) {
  const { fullName, email, department, role, joiningDate, status, skills, leaveStartDate, leaveEndDate } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  if (!department) {
    errors.push({ field: 'department', message: 'Department is required' });
  } else if (!DEPARTMENTS.includes(department)) {
    errors.push({ field: 'department', message: `Department must be one of: ${DEPARTMENTS.join(', ')}` });
  }

  if (!role || typeof role !== 'string' || !role.trim()) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  if (!joiningDate) {
    errors.push({ field: 'joiningDate', message: 'Joining date is required' });
  } else if (isNaN(new Date(joiningDate).getTime())) {
    errors.push({ field: 'joiningDate', message: 'Invalid joining date' });
  }

  const effectiveStatus = status || 'Active';
  if (!EMPLOYEE_STATUSES.includes(effectiveStatus)) {
    errors.push({ field: 'status', message: `Status must be one of: ${EMPLOYEE_STATUSES.join(', ')}` });
  }

  if (effectiveStatus === 'On Leave') {
    if (!leaveStartDate) {
      errors.push({ field: 'leaveStartDate', message: 'Leave start date is required when employee is On Leave' });
    } else if (isNaN(new Date(leaveStartDate).getTime())) {
      errors.push({ field: 'leaveStartDate', message: 'Invalid leave start date' });
    }

    if (!leaveEndDate) {
      errors.push({ field: 'leaveEndDate', message: 'Leave end date is required when employee is On Leave' });
    } else if (isNaN(new Date(leaveEndDate).getTime())) {
      errors.push({ field: 'leaveEndDate', message: 'Invalid leave end date' });
    }

    if (leaveStartDate && leaveEndDate && !isDateOrderValid(leaveStartDate, leaveEndDate)) {
      errors.push({ field: 'leaveEndDate', message: 'Leave end date cannot be earlier than leave start date' });
    }
  }

  if (skills !== undefined && !Array.isArray(skills)) {
    errors.push({ field: 'skills', message: 'Skills must be an array of strings' });
  }

  if (errors.length > 0) {
    return next(
      new BadRequestError(`Validation failed: ${errors.map((e) => e.message).join('; ')}`, errors)
    );
  }

  // Sanitize / normalize
  req.body.email = email.trim().toLowerCase();
  req.body.fullName = fullName.trim();
  if (req.body.role) req.body.role = req.body.role.trim();
  if (req.body.phone) req.body.phone = String(req.body.phone).trim();
  delete req.body.employeeId; // Server-generated only

  next();
}

function validateUpdateEmployee(req, res, next) {
  const { fullName, email, department, role, joiningDate, status, skills, leaveStartDate, leaveEndDate } = req.body;
  const errors = [];

  // Never allow changing employeeId
  if (req.body.employeeId !== undefined) {
    delete req.body.employeeId;
  }

  if (fullName !== undefined && (!fullName || typeof fullName !== 'string' || !fullName.trim())) {
    errors.push({ field: 'fullName', message: 'Full name cannot be empty' });
  }

  if (email !== undefined) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    } else {
      req.body.email = email.trim().toLowerCase();
    }
  }

  if (department !== undefined && !DEPARTMENTS.includes(department)) {
    errors.push({ field: 'department', message: `Department must be one of: ${DEPARTMENTS.join(', ')}` });
  }

  if (role !== undefined && (!role || typeof role !== 'string' || !role.trim())) {
    errors.push({ field: 'role', message: 'Role cannot be empty' });
  }

  if (joiningDate !== undefined && isNaN(new Date(joiningDate).getTime())) {
    errors.push({ field: 'joiningDate', message: 'Invalid joining date' });
  }

  if (status !== undefined && !EMPLOYEE_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${EMPLOYEE_STATUSES.join(', ')}` });
  }

  if (status === 'On Leave') {
    if (!leaveStartDate) {
      errors.push({ field: 'leaveStartDate', message: 'Leave start date is required when employee is On Leave' });
    }
    if (!leaveEndDate) {
      errors.push({ field: 'leaveEndDate', message: 'Leave end date is required when employee is On Leave' });
    }
    if (leaveStartDate && leaveEndDate && !isDateOrderValid(leaveStartDate, leaveEndDate)) {
      errors.push({ field: 'leaveEndDate', message: 'Leave end date cannot be earlier than leave start date' });
    }
  }

  if (skills !== undefined && !Array.isArray(skills)) {
    errors.push({ field: 'skills', message: 'Skills must be an array of strings' });
  }

  if (errors.length > 0) {
    return next(
      new BadRequestError(`Validation failed: ${errors.map((e) => e.message).join('; ')}`, errors)
    );
  }

  if (req.body.fullName) req.body.fullName = req.body.fullName.trim();
  if (req.body.role) req.body.role = req.body.role.trim();
  if (req.body.phone !== undefined) req.body.phone = String(req.body.phone).trim();

  next();
}

module.exports = {
  validateCreateEmployee,
  validateUpdateEmployee,
};
