import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import apiClient from '../../api/client';
import {
  DEPARTMENTS,
  TASK_PRIORITIES,
  toInputDateFormat,
} from '../../utils/formatters';
import { AlertCircle, AlertTriangle, UserCheck, Lock } from 'lucide-react';

export function TaskFormModal({ isOpen, onClose, task = null, onSaved }) {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(task);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'Development',
    priority: 'Medium',
    startDate: toInputDateFormat(new Date()),
    dueDate: toInputDateFormat(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    assignedEmployee: '',
  });

  const [employees, setEmployees] = useState([]);
  const [employeeCapacityMap, setEmployeeCapacityMap] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Load employees and their current active task count when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function loadWorkforceData() {
      try {
        const [empRes, taskRes] = await Promise.all([
          apiClient.get('/employees?limit=100'),
          apiClient.get('/tasks?limit=200'),
        ]);

        const allEmps = empRes.data.data || [];
        setEmployees(allEmps);

        // Calculate active task count per employee
        const allTasks = taskRes.data.data || [];
        const capacityMap = {};
        allTasks.forEach((t) => {
          if (t.status === 'Todo' || t.status === 'In Progress') {
            const empId = t.assignedEmployee?._id || t.assignedEmployee;
            if (empId) {
              capacityMap[empId] = (capacityMap[empId] || 0) + 1;
            }
          }
        });
        setEmployeeCapacityMap(capacityMap);
      } catch (err) {
        console.error('Failed to load employee list:', err);
      }
    }

    loadWorkforceData();
  }, [isOpen]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        department: task.department || 'Development',
        priority: task.priority || 'Medium',
        startDate: toInputDateFormat(task.startDate),
        dueDate: toInputDateFormat(task.dueDate),
        assignedEmployee: task.assignedEmployee?._id || task.assignedEmployee || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        department: 'Development',
        priority: 'Medium',
        startDate: toInputDateFormat(new Date()),
        dueDate: toInputDateFormat(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        assignedEmployee: '',
      });
    }
    setFormErrors({});
    setServerError(null);
  }, [task, isOpen]);

  // Is task immutable?
  const isReadOnly = task && (task.status === 'Completed' || task.status === 'Cancelled');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Task title is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';
    if (formData.startDate && formData.dueDate && formData.dueDate < formData.startDate) {
      errors.dueDate = 'Due date cannot be earlier than start date';
    }

    // Availability validation check on client before submission
    if (formData.assignedEmployee) {
      const selectedEmp = employees.find((e) => e._id === formData.assignedEmployee);
      if (selectedEmp) {
        if (selectedEmp.status === 'Inactive') {
          errors.assignedEmployee = `Cannot assign to ${selectedEmp.fullName} (Inactive employee).`;
        } else if (
          selectedEmp.status === 'On Leave' &&
          selectedEmp.leaveStartDate &&
          selectedEmp.leaveEndDate
        ) {
          const startDay = formData.startDate;
          const leaveStart = toInputDateFormat(selectedEmp.leaveStartDate);
          const leaveEnd = toInputDateFormat(selectedEmp.leaveEndDate);
          if (startDay >= leaveStart && startDay <= leaveEnd) {
            errors.assignedEmployee = `${selectedEmp.fullName} is On Leave during the selected start date (${leaveStart} to ${leaveEnd}).`;
          }
        }

        // Capacity check
        const currentCount = employeeCapacityMap[selectedEmp._id] || 0;
        const isCurrentAssignee =
          task && (task.assignedEmployee?._id || task.assignedEmployee) === selectedEmp._id;
        const effectiveCount = isCurrentAssignee ? currentCount - 1 : currentCount;

        if (effectiveCount >= 3) {
          errors.assignedEmployee = `${selectedEmp.fullName} already has 3 active tasks (maximum capacity reached).`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      department: formData.department,
      priority: formData.priority,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      assignedEmployee: formData.assignedEmployee || null,
    };

    try {
      if (isEditing) {
        await apiClient.put(`/tasks/${task._id}`, payload);
        success(`Task '${payload.title}' updated successfully!`);
      } else {
        await apiClient.post('/tasks', payload);
        success(`Task '${payload.title}' created with initial status Todo!`);
      }
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err.message);
      toastError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Task (${task.taskId})` : 'Create New Task'}
      maxWidth="max-w-2xl"
    >
      {isReadOnly ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start space-x-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Record Immutable: </span>
              This task is in <strong>{task.status}</strong> status and cannot be edited. Completed and
              Cancelled tasks are preserved as permanent historical records.
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Implement API rate limiter middleware"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.title
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            />
            {formErrors.title && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed acceptance criteria or implementation notes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level <span className="text-rose-500">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                  formErrors.startDate
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />
              {formErrors.startDate && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.startDate}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                  formErrors.dueDate
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
              />
              {formErrors.dueDate && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Assigned Employee with Capacity & Availability Indicators */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Employee
              </label>
              <span className="text-[11px] text-slate-400">Rule: Max 3 active tasks per employee</span>
            </div>
            <select
              name="assignedEmployee"
              value={formData.assignedEmployee}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                formErrors.assignedEmployee
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
              }`}
            >
              <option value="">-- Unassigned --</option>
              {employees.map((emp) => {
                const count = employeeCapacityMap[emp._id] || 0;
                const isCurrentAssignee =
                  task && (task.assignedEmployee?._id || task.assignedEmployee) === emp._id;
                const effectiveCount = isCurrentAssignee ? count - 1 : count;
                const isFull = effectiveCount >= 3;
                const isInactive = emp.status === 'Inactive';
                const isOnLeave = emp.status === 'On Leave';

                let tag = `Active • ${effectiveCount}/3 tasks`;
                if (isInactive) tag = 'Inactive';
                else if (isFull) tag = 'Capacity Full (3/3)';
                else if (isOnLeave) tag = 'On Leave';

                return (
                  <option
                    key={emp._id}
                    value={emp._id}
                    disabled={isInactive || isFull}
                  >
                    {emp.fullName} ({emp.department} - {tag})
                  </option>
                );
              })}
            </select>
            {formErrors.assignedEmployee && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {formErrors.assignedEmployee}
              </p>
            )}
          </div>

          {/* Initial Status notice */}
          {!isEditing && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>
                New tasks automatically start with initial status <strong>Todo</strong>.
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving Task...' : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
