import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useToast } from '../../components/common/ToastContext';
import { StatusBadge, PriorityBadge, DepartmentBadge, OverdueBadge } from '../../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../../components/common/LoadingSpinner';
import { EmployeeFormModal } from './EmployeeFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch employee
      const empRes = await apiClient.get(`/employees/${id}`);
      setEmployee(empRes.data.data);

      // Fetch all tasks for this employee
      const taskRes = await apiClient.get(`/tasks?limit=100&search=${empRes.data.data.employeeId}`);
      // Also filter tasks specifically assigned to this employee's ID
      const assignedTasks = (taskRes.data.data || []).filter(
        (t) =>
          String(t.assignedEmployee?._id || t.assignedEmployee) === String(empRes.data.data._id) ||
          t.assignedEmployeeSnapshot?.employeeId === empRes.data.data.employeeId
      );
      setTasks(assignedTasks);
    } catch (err) {
      setError(err.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleConfirmDelete = async () => {
    if (!employee) return;
    try {
      setDeleting(true);
      const res = await apiClient.delete(`/employees/${employee._id}`);
      success(res.data.message || 'Employee deleted successfully');
      setDeleteConfirmOpen(false);
      navigate('/employees');
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading employee profile and workload history..." />;
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Link
          to="/employees"
          className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to directory</span>
        </Link>
        <ErrorBanner message={error || 'Employee not found'} onRetry={fetchEmployeeData} />
      </div>
    );
  }

  // Active vs Historical Tasks
  const activeTasks = tasks.filter((t) => t.status === 'Todo' || t.status === 'In Progress');
  const historicalTasks = tasks.filter((t) => t.status === 'Completed' || t.status === 'Cancelled');
  const capacityPercent = Math.min(100, Math.round((activeTasks.length / 3) * 100));

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/employees"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Employee Directory</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              {employee.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {employee.fullName}
                </h2>
                <StatusBadge status={employee.status} />
              </div>
              <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center space-x-2">
                <span>{employee.role}</span>
                <span>•</span>
                <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {employee.employeeId}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <DepartmentBadge department={employee.department} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Email Address</p>
              <p className="font-semibold text-slate-800 break-all">{employee.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Phone</p>
              <p className="font-semibold text-slate-800">{employee.phone || '—'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Joining Date</p>
              <p className="font-semibold text-slate-800">{formatDate(employee.joiningDate)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Department Unit</p>
              <p className="font-semibold text-slate-800">{employee.department}</p>
            </div>
          </div>
        </div>

        {/* Skills Tag Cloud */}
        {employee.skills && employee.skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Verified Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Leave Duration Notice Banner */}
        {employee.status === 'On Leave' && employee.leaveStartDate && employee.leaveEndDate && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <span className="font-bold">Currently On Leave: </span>
              From {formatDate(employee.leaveStartDate)} through {formatDate(employee.leaveEndDate)}{' '}
              (inclusive). Any task assignment whose start date falls inside this window will be rejected.
            </div>
          </div>
        )}
      </div>

      {/* Task Capacity Gauge Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Workload Capacity Meter</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict business rule: Maximum 3 concurrent active tasks (Todo or In Progress).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-extrabold px-3 py-1 rounded-xl border ${
                activeTasks.length >= 3
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : activeTasks.length === 2
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {activeTasks.length} / 3 Tasks ({capacityPercent}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              activeTasks.length >= 3
                ? 'bg-rose-600'
                : activeTasks.length === 2
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>

        <p className="text-xs text-slate-500 mt-3">
          {activeTasks.length >= 3
            ? '⚠️ This employee is at maximum workload capacity. New assignments will be rejected until an existing task is completed or cancelled.'
            : activeTasks.length === 2
            ? 'ℹ️ Employee has 1 available task slot before reaching maximum capacity.'
            : '✅ Employee has ample capacity to accept new assignments.'}
        </p>
      </div>

      {/* Active Tasks Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Active Assigned Tasks ({activeTasks.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Task ID</th>
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Priority</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {activeTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">
                    No active tasks currently assigned.
                  </td>
                </tr>
              ) : (
                activeTasks.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-700">
                      {t.taskId}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <Link to={`/tasks/${t._id}`} className="hover:text-brand-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-6">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <span>{formatDate(t.dueDate)}</span>
                        {t.isOverdue && <OverdueBadge />}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/tasks/${t._id}`}
                        className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        title="View Task Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Tasks Section (Completed & Cancelled) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Historical Tasks Archive ({historicalTasks.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Completed & Cancelled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Task ID</th>
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Priority</th>
                <th className="py-3 px-6">Final Status</th>
                <th className="py-3 px-6">Completed / Finished</th>
                <th className="py-3 px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {historicalTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">
                    No historical tasks in archive.
                  </td>
                </tr>
              ) : (
                historicalTasks.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-600">
                      {t.taskId}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">
                      <Link to={`/tasks/${t._id}`} className="hover:text-brand-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-6">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {t.completedDate ? formatDate(t.completedDate) : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/tasks/${t._id}`}
                        className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        title="View Task Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        employee={employee}
        onSaved={fetchEmployeeData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee Record"
        message={`Are you sure you want to delete ${employee.fullName} (${employee.employeeId})? Note: If this employee has any active tasks (Todo or In Progress), deletion will be rejected per Rule 7.`}
        confirmText="Delete Employee"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
