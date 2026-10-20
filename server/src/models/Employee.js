const mongoose = require('mongoose');

const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
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
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: EMPLOYEE_STATUSES,
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    leaveStartDate: {
      type: Date,
      default: null,
    },
    leaveEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation for leave dates
employeeSchema.pre('validate', function (next) {
  if (this.status === 'On Leave') {
    if (!this.leaveStartDate) {
      this.invalidate('leaveStartDate', 'Leave start date is required when employee is On Leave');
    }
    if (!this.leaveEndDate) {
      this.invalidate('leaveEndDate', 'Leave end date is required when employee is On Leave');
    }
    if (this.leaveStartDate && this.leaveEndDate) {
      const start = new Date(this.leaveStartDate);
      const end = new Date(this.leaveEndDate);
      if (end < start) {
        this.invalidate('leaveEndDate', 'Leave end date cannot be earlier than leave start date');
      }
    }
  } else {
    // If not on leave, ensure leave dates are null/cleared
    this.leaveStartDate = null;
    this.leaveEndDate = null;
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = {
  Employee,
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
};
