const mongoose = require('mongoose');
const { DEPARTMENTS } = require('./Employee');
const { isTaskOverdue } = require('../utils/dateUtils');

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    assignedEmployeeSnapshot: {
      employeeId: { type: String, default: null },
      fullName: { type: String, default: null },
      department: { type: String, default: null },
      email: { type: String, default: null },
      role: { type: String, default: null },
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department',
      },
      index: true,
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'Todo',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for overdue calculation
taskSchema.virtual('isOverdue').get(function () {
  return isTaskOverdue(this.dueDate, this.status);
});

// Pre-validate for date order
taskSchema.pre('validate', function (next) {
  if (this.startDate && this.dueDate) {
    const start = new Date(this.startDate);
    const due = new Date(this.dueDate);
    if (due < start) {
      this.invalidate('dueDate', 'Due date cannot be earlier than start date');
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = {
  Task,
  TASK_PRIORITIES,
  TASK_STATUSES,
};
