const mongoose = require('mongoose');
const { Task } = require('../models/Task');
const { Employee } = require('../models/Employee');
const { getNextTaskId } = require('../utils/idGenerator');
const { isDateWithinInclusive, isDateOrderValid, isTaskOverdue } = require('../utils/dateUtils');
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require('../utils/errors');

const ALLOWED_TASK_SORT_FIELDS = [
  'createdAt',
  'dueDate',
  'startDate',
  'priority',
  'title',
  'status',
  'department',
  'employeeName',
];

const VALID_TRANSITIONS = {
  Todo: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

class TaskService {
  /**
   * Helper to validate employee availability and capacity rules.
   */
  async validateEmployeeForTask(employeeIdOrObj, startDate, excludeTaskId = null) {
    if (!employeeIdOrObj) return null;

    let employee = null;
    if (typeof employeeIdOrObj === 'object' && employeeIdOrObj._id) {
      employee = employeeIdOrObj;
    } else if (mongoose.Types.ObjectId.isValid(employeeIdOrObj)) {
      employee = await Employee.findById(employeeIdOrObj);
    } else {
      employee = await Employee.findOne({ employeeId: employeeIdOrObj });
    }

    if (!employee) {
      throw new NotFoundError(`Assigned employee '${employeeIdOrObj}' not found.`);
    }

    // Rule 1: A task can only be assigned to an employee whose status is Active.
    if (employee.status === 'Inactive') {
      throw new BadRequestError(
        `Cannot assign task to employee '${employee.fullName}'. Employee is Inactive.`
      );
    }

    // Rule 1: Reject if employee is On Leave and task startDate falls within leave period (inclusive)
    if (employee.status === 'On Leave' && employee.leaveStartDate && employee.leaveEndDate) {
      if (isDateWithinInclusive(startDate, employee.leaveStartDate, employee.leaveEndDate)) {
        throw new BadRequestError(
          `Cannot assign task to employee '${employee.fullName}'. Employee is On Leave from ${
            employee.leaveStartDate.toISOString().split('T')[0]
          } to ${employee.leaveEndDate.toISOString().split('T')[0]}.`
        );
      }
    }

    // Rule 5: Check employee capacity (at most 3 active tasks: Todo or In Progress)
    const capacityQuery = {
      assignedEmployee: employee._id,
      status: { $in: ['Todo', 'In Progress'] },
    };
    if (excludeTaskId) {
      capacityQuery._id = { $ne: excludeTaskId };
    }

    const activeTasksCount = await Task.countDocuments(capacityQuery);
    if (activeTasksCount >= 3) {
      throw new ConflictError(
        `Employee '${employee.fullName}' (${employee.employeeId}) has reached the maximum capacity of 3 active tasks (currently has ${activeTasksCount}).`
      );
    }

    return employee;
  }

  async createTask(taskData) {
    // Rule 2: Date order check
    if (!isDateOrderValid(taskData.startDate, taskData.dueDate)) {
      throw new BadRequestError('Due date cannot be earlier than start date.');
    }

    let assignedEmployeeDoc = null;
    let employeeSnapshot = null;

    if (taskData.assignedEmployee) {
      assignedEmployeeDoc = await this.validateEmployeeForTask(
        taskData.assignedEmployee,
        taskData.startDate
      );
      employeeSnapshot = {
        employeeId: assignedEmployeeDoc.employeeId,
        fullName: assignedEmployeeDoc.fullName,
        department: assignedEmployeeDoc.department,
        email: assignedEmployeeDoc.email,
        role: assignedEmployeeDoc.role,
      };
    }

    const taskId = await getNextTaskId();

    // Rule 3: Initial status must always be Todo
    const task = new Task({
      ...taskData,
      taskId,
      status: 'Todo',
      completedDate: null, // Rule 4: never accept client completedDate
      assignedEmployee: assignedEmployeeDoc ? assignedEmployeeDoc._id : null,
      assignedEmployeeSnapshot: employeeSnapshot,
    });

    await task.save();
    return Task.findById(task._id).populate('assignedEmployee');
  }

  async getTasks(params = {}) {
    const {
      search,
      department,
      priority,
      status,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
      createdDateFrom,
      createdDateTo,
      isOverdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const matchStage = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { title: searchRegex },
        { taskId: searchRegex },
        { 'assignedEmployeeSnapshot.fullName': searchRegex },
        { 'assignedEmployeeSnapshot.employeeId': searchRegex },
      ];
    }

    if (department && department.trim()) {
      matchStage.department = department.trim();
    }

    if (priority && priority.trim()) {
      matchStage.priority = priority.trim();
    }

    if (status && status.trim()) {
      matchStage.status = status.trim();
    }

    // Date filters
    if (startDateFrom || startDateTo) {
      matchStage.startDate = {};
      if (startDateFrom) matchStage.startDate.$gte = new Date(startDateFrom);
      if (startDateTo) matchStage.startDate.$lte = new Date(startDateTo);
    }

    if (dueDateFrom || dueDateTo) {
      matchStage.dueDate = {};
      if (dueDateFrom) matchStage.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) matchStage.dueDate.$lte = new Date(dueDateTo);
    }

    if (createdDateFrom || createdDateTo) {
      matchStage.createdAt = {};
      if (createdDateFrom) matchStage.createdAt.$gte = new Date(createdDateFrom);
      if (createdDateTo) matchStage.createdAt.$lte = new Date(createdDateTo);
    }

    // Filter by overdue if explicitly requested
    if (isOverdue === 'true' || isOverdue === true) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
      matchStage.dueDate = { ...matchStage.dueDate, $lt: todayDate };
      matchStage.status = { $nin: ['Completed', 'Cancelled'] };
    }

    const validatedSortBy = ALLOWED_TASK_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Building Aggregation Pipeline for custom priority ranking and populated sort
    const pipeline = [{ $match: matchStage }];

    // Add priority rank for explicit priority sorting (Critical: 4, High: 3, Medium: 2, Low: 1)
    pipeline.push({
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
              { case: { $eq: ['$priority', 'High'] }, then: 3 },
              { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
              { case: { $eq: ['$priority', 'Low'] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    });

    let sortStage = {};
    if (validatedSortBy === 'priority') {
      sortStage = { priorityRank: sortDirection, createdAt: -1 };
    } else if (validatedSortBy === 'employeeName') {
      sortStage = { 'assignedEmployeeSnapshot.fullName': sortDirection };
    } else {
      sortStage = { [validatedSortBy]: sortDirection };
    }

    pipeline.push({ $sort: sortStage });

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    // Facet for pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: parsedLimit },
          {
            $lookup: {
              from: 'employees',
              localField: 'assignedEmployee',
              foreignField: '_id',
              as: 'assignedEmployee',
            },
          },
          {
            $unwind: {
              path: '$assignedEmployee',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    });

    const result = await Task.aggregate(pipeline);
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const rawData = result[0].data || [];

    // Augment with isOverdue computed field
    const data = rawData.map((task) => ({
      ...task,
      isOverdue: isTaskOverdue(task.dueDate, task.status),
    }));

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    return {
      data,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
    };
  }

  async getTasksForExport(params = {}) {
    const {
      search,
      department,
      priority,
      status,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
      createdDateFrom,
      createdDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const matchStage = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { title: searchRegex },
        { taskId: searchRegex },
        { 'assignedEmployeeSnapshot.fullName': searchRegex },
        { 'assignedEmployeeSnapshot.employeeId': searchRegex },
      ];
    }

    if (department && department.trim()) matchStage.department = department.trim();
    if (priority && priority.trim()) matchStage.priority = priority.trim();
    if (status && status.trim()) matchStage.status = status.trim();

    if (startDateFrom || startDateTo) {
      matchStage.startDate = {};
      if (startDateFrom) matchStage.startDate.$gte = new Date(startDateFrom);
      if (startDateTo) matchStage.startDate.$lte = new Date(startDateTo);
    }

    if (dueDateFrom || dueDateTo) {
      matchStage.dueDate = {};
      if (dueDateFrom) matchStage.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) matchStage.dueDate.$lte = new Date(dueDateTo);
    }

    if (createdDateFrom || createdDateTo) {
      matchStage.createdAt = {};
      if (createdDateFrom) matchStage.createdAt.$gte = new Date(createdDateFrom);
      if (createdDateTo) matchStage.createdAt.$lte = new Date(createdDateTo);
    }

    const validatedSortBy = ALLOWED_TASK_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const pipeline = [{ $match: matchStage }];

    pipeline.push({
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
              { case: { $eq: ['$priority', 'High'] }, then: 3 },
              { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
              { case: { $eq: ['$priority', 'Low'] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    });

    let sortStage = {};
    if (validatedSortBy === 'priority') {
      sortStage = { priorityRank: sortDirection, createdAt: -1 };
    } else if (validatedSortBy === 'employeeName') {
      sortStage = { 'assignedEmployeeSnapshot.fullName': sortDirection };
    } else {
      sortStage = { [validatedSortBy]: sortDirection };
    }
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'assignedEmployee',
        foreignField: '_id',
        as: 'assignedEmployee',
      },
    });
    pipeline.push({
      $unwind: {
        path: '$assignedEmployee',
        preserveNullAndEmptyArrays: true,
      },
    });

    const tasks = await Task.aggregate(pipeline);
    return tasks.map((task) => ({
      ...task,
      isOverdue: isTaskOverdue(task.dueDate, task.status),
    }));
  }

  async getTaskById(id) {
    let task = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      task = await Task.findById(id).populate('assignedEmployee');
    }
    if (!task) {
      task = await Task.findOne({ taskId: id }).populate('assignedEmployee');
    }
    if (!task) {
      throw new NotFoundError(`Task with id '${id}' not found`);
    }

    const taskObj = task.toObject();
    taskObj.isOverdue = isTaskOverdue(task.dueDate, task.status);
    return taskObj;
  }

  async updateTask(id, updateData) {
    let task = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      task = await Task.findById(id);
    }
    if (!task) {
      task = await Task.findOne({ taskId: id });
    }
    if (!task) {
      throw new NotFoundError(`Task with id '${id}' not found`);
    }

    // Rule 3: Completed or Cancelled tasks cannot be edited.
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      throw new BadRequestError(
        `Tasks in '${task.status}' status are immutable historical records and cannot be edited.`
      );
    }

    const effectiveStartDate = updateData.startDate || task.startDate;
    const effectiveDueDate = updateData.dueDate || task.dueDate;

    // Rule 2: Date order check
    if (!isDateOrderValid(effectiveStartDate, effectiveDueDate)) {
      throw new BadRequestError('Due date cannot be earlier than start date.');
    }

    // Handle assignee change or revalidation
    const isAssigneeChanging =
      updateData.assignedEmployee !== undefined &&
      String(updateData.assignedEmployee || '') !== String(task.assignedEmployee || '');
    const isStartDateChanging =
      updateData.startDate &&
      new Date(updateData.startDate).getTime() !== new Date(task.startDate).getTime();

    if (isAssigneeChanging || (isStartDateChanging && task.assignedEmployee)) {
      const targetAssignee = isAssigneeChanging
        ? updateData.assignedEmployee
        : task.assignedEmployee;

      if (targetAssignee) {
        const assignedEmployeeDoc = await this.validateEmployeeForTask(
          targetAssignee,
          effectiveStartDate,
          task._id // exclude current task so it's not counted twice!
        );
        task.assignedEmployee = assignedEmployeeDoc._id;
        task.assignedEmployeeSnapshot = {
          employeeId: assignedEmployeeDoc.employeeId,
          fullName: assignedEmployeeDoc.fullName,
          department: assignedEmployeeDoc.department,
          email: assignedEmployeeDoc.email,
          role: assignedEmployeeDoc.role,
        };
      } else {
        task.assignedEmployee = null;
        task.assignedEmployeeSnapshot = null;
      }
    }

    if (updateData.title) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.department) task.department = updateData.department;
    if (updateData.priority) task.priority = updateData.priority;
    if (updateData.startDate) task.startDate = updateData.startDate;
    if (updateData.dueDate) task.dueDate = updateData.dueDate;

    await task.save();
    return Task.findById(task._id).populate('assignedEmployee');
  }

  async updateTaskStatus(id, newStatus) {
    let task = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      task = await Task.findById(id);
    }
    if (!task) {
      task = await Task.findOne({ taskId: id });
    }
    if (!task) {
      throw new NotFoundError(`Task with id '${id}' not found`);
    }

    const currentStatus = task.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    // Rule 3: Allowed transitions check
    if (!allowedTransitions.includes(newStatus)) {
      if (currentStatus === 'Completed' || currentStatus === 'Cancelled') {
        throw new BadRequestError(
          `Cannot change status. Tasks in '${currentStatus}' status are final and cannot be reopened or transitioned.`
        );
      }
      throw new BadRequestError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Permitted transitions: [${allowedTransitions.join(
          ', '
        )}]`
      );
    }

    task.status = newStatus;

    // Rule 4: Server generated completedDate when transitioning to Completed
    if (newStatus === 'Completed') {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    await task.save();
    return Task.findById(task._id).populate('assignedEmployee');
  }

  async deleteTask(id) {
    let task = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      task = await Task.findById(id);
    }
    if (!task) {
      task = await Task.findOne({ taskId: id });
    }
    if (!task) {
      throw new NotFoundError(`Task with id '${id}' not found`);
    }

    // Section 5: Reject deletion of Completed and Cancelled tasks
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      throw new BadRequestError(
        `Tasks with status '${task.status}' cannot be deleted as they are preserved for historical audit records.`
      );
    }

    await Task.findByIdAndDelete(task._id);

    return {
      message: `Task ${task.taskId} ('${task.title}') deleted successfully.`,
    };
  }
}

module.exports = new TaskService();
