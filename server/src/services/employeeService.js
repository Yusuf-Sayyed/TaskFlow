const { Employee } = require('../models/Employee');
const { Task } = require('../models/Task');
const { getNextEmployeeId } = require('../utils/idGenerator');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const mongoose = require('mongoose');

const ALLOWED_SORT_FIELDS = ['createdAt', 'fullName', 'employeeId', 'joiningDate', 'department', 'status'];

class EmployeeService {
  async createEmployee(employeeData) {
    const normalizedEmail = (employeeData.email || '').trim().toLowerCase();

    // Check duplicate email
    const existing = await Employee.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ConflictError(`An employee with email '${normalizedEmail}' already exists.`);
    }

    const employeeId = await getNextEmployeeId();

    const employee = new Employee({
      ...employeeData,
      employeeId,
      email: normalizedEmail,
    });

    await employee.save();
    return employee;
  }

  async getEmployees(params = {}) {
    const {
      search,
      department,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: searchRegex }, { employeeId: searchRegex }];
    }

    if (department && department.trim()) {
      query.department = department.trim();
    }

    if (status && status.trim()) {
      query.status = status.trim();
    }

    // Whitelist sorting
    const validatedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [validatedSortBy]: sortDirection };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, data] = await Promise.all([
      Employee.countDocuments(query),
      Employee.find(query).sort(sortOptions).skip(skip).limit(parsedLimit),
    ]);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    return {
      data,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
    };
  }

  async getEmployeesForExport(params = {}) {
    const { search, department, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: searchRegex }, { employeeId: searchRegex }];
    }

    if (department && department.trim()) {
      query.department = department.trim();
    }

    if (status && status.trim()) {
      query.status = status.trim();
    }

    const validatedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    return Employee.find(query).sort({ [validatedSortBy]: sortDirection });
  }

  async getEmployeeById(id) {
    let employee = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      employee = await Employee.findById(id);
    }
    if (!employee) {
      employee = await Employee.findOne({ employeeId: id });
    }
    if (!employee) {
      throw new NotFoundError(`Employee with id '${id}' not found`);
    }
    return employee;
  }

  async updateEmployee(id, updateData) {
    const employee = await this.getEmployeeById(id);

    if (updateData.email) {
      const normalizedEmail = updateData.email.trim().toLowerCase();
      if (normalizedEmail !== employee.email) {
        const existing = await Employee.findOne({
          email: normalizedEmail,
          _id: { $ne: employee._id },
        });
        if (existing) {
          throw new ConflictError(`An employee with email '${normalizedEmail}' already exists.`);
        }
        employee.email = normalizedEmail;
      }
    }

    if (updateData.fullName) employee.fullName = updateData.fullName;
    if (updateData.phone !== undefined) employee.phone = updateData.phone;
    if (updateData.department) employee.department = updateData.department;
    if (updateData.role) employee.role = updateData.role;
    if (updateData.joiningDate) employee.joiningDate = updateData.joiningDate;
    if (updateData.skills !== undefined) employee.skills = updateData.skills;

    if (updateData.status) {
      employee.status = updateData.status;
      if (updateData.status === 'On Leave') {
        employee.leaveStartDate = updateData.leaveStartDate;
        employee.leaveEndDate = updateData.leaveEndDate;
      } else {
        employee.leaveStartDate = null;
        employee.leaveEndDate = null;
      }
    }

    await employee.save();

    // If employee name, department, role, or email was updated, update snapshots on active tasks
    await Task.updateMany(
      { assignedEmployee: employee._id },
      {
        $set: {
          'assignedEmployeeSnapshot.fullName': employee.fullName,
          'assignedEmployeeSnapshot.department': employee.department,
          'assignedEmployeeSnapshot.email': employee.email,
          'assignedEmployeeSnapshot.role': employee.role,
        },
      }
    );

    return employee;
  }

  async deleteEmployee(id) {
    const employee = await this.getEmployeeById(id);

    // Rule 7: Do not allow deletion if employee has any Todo or In Progress tasks
    const activeTasksCount = await Task.countDocuments({
      assignedEmployee: employee._id,
      status: { $in: ['Todo', 'In Progress'] },
    });

    if (activeTasksCount > 0) {
      throw new ConflictError(
        `Cannot delete employee '${employee.fullName}' (${employee.employeeId}). The employee is currently assigned to ${activeTasksCount} active task(s) (Todo or In Progress). Please reassign or complete them before deleting.`
      );
    }

    // Unset assignedEmployee ObjectId on historical tasks, while retaining assignedEmployeeSnapshot
    await Task.updateMany(
      { assignedEmployee: employee._id },
      { $set: { assignedEmployee: null } }
    );

    await Employee.findByIdAndDelete(employee._id);

    return {
      message: `Employee ${employee.fullName} (${employee.employeeId}) deleted successfully. Historical tasks preserved.`,
    };
  }
}

module.exports = new EmployeeService();
