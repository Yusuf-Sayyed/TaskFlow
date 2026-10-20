import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useToast } from '../../components/common/ToastContext';
import {
  StatusBadge,
  PriorityBadge,
  DepartmentBadge,
  OverdueBadge,
} from '../../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../../components/common/LoadingSpinner';
import { TaskFormModal } from './TaskFormModal';
import { TaskStatusChangeModal } from './TaskStatusChangeModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDate, formatDateTime, ALLOWED_TRANSITIONS } from '../../utils/formatters';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  Briefcase,
  User,
  ArrowRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/tasks/${id}`);
      setTask(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleConfirmDelete = async () => {
    if (!task) return;
    try {
      setDeleting(true);
      const res = await apiClient.delete(`/tasks/${task._id}`);
      success(res.data.message || 'Task deleted successfully');
      setDeleteConfirmOpen(false);
      navigate('/tasks');
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/tasks');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading task details..." />;
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Task List</span>
        </button>
        <ErrorBanner message={error || 'Task not found'} onRetry={fetchTask} />
      </div>
    );
  }

  const isImmutable = task.status === 'Completed' || task.status === 'Cancelled';
  const allowedNext = ALLOWED_TRANSITIONS[task.status] || [];
  const assignee = task.assignedEmployee;
  const snapshot = task.assignedEmployeeSnapshot;
  const hasAssignee = Boolean(assignee || snapshot?.fullName);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer group"
          title="Return to task management list"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tasks</span>
        </button>

        <div className="flex items-center space-x-3">
          {!isImmutable && (
            <button
              onClick={() => setStatusModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Change Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setEditModalOpen(true)}
            disabled={isImmutable}
            className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
              isImmutable
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
            title={isImmutable ? 'Completed/Cancelled tasks cannot be edited' : 'Edit Task'}
          >
            <Edit2 className="w-4 h-4 text-slate-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={isImmutable}
            className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
              isImmutable
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
            }`}
            title={isImmutable ? 'Historical records cannot be deleted' : 'Delete Task'}
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Overdue Banner if active and overdue */}
      {task.isOverdue && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-900 shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h4 className="text-sm font-bold">This task is Overdue</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                The deadline was {formatDate(task.dueDate)}. Status remains {task.status}.
              </p>
            </div>
          </div>
          <OverdueBadge />
        </div>
      )}

      {/* Main Task Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {task.taskId}
              </span>
              <DepartmentBadge department={task.department} />
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {task.title}
            </h2>
          </div>
        </div>

        {/* Task Description */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Dates & Milestones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Start Date</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900">{formatDate(task.startDate)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due Date</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900">{formatDate(task.dueDate)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Created</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">{formatDateTime(task.createdAt)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {task.completedDate ? formatDateTime(task.completedDate) : 'Not completed'}
            </p>
          </div>
        </div>
      </div>

      {/* Assignee Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Assigned Personnel</h3>

        {hasAssignee ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                {(assignee?.fullName || snapshot?.fullName || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-slate-900">
                    {assignee?.fullName || snapshot?.fullName}
                  </h4>
                  {!assignee && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                      Archived Snapshot
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span>{assignee?.role || snapshot?.role}</span> •{' '}
                  <span className="font-mono">{assignee?.employeeId || snapshot?.employeeId}</span> •{' '}
                  <span>{assignee?.email || snapshot?.email}</span>
                </p>
              </div>
            </div>

            {assignee && (
              <Link
                to={`/employees/${assignee._id}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
              >
                <span>View Full Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-sm">
            This task is currently unassigned. Click "Edit" to allocate to an active employee.
          </div>
        )}
      </div>

      {/* State Machine Transition Guidelines */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2">Workflow State Machine</h3>
        <p className="text-xs text-slate-400 mb-6">
          Backend verified lifecycle rules governing this task
        </p>

        {isImmutable ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center space-x-3">
            <Lock className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <div>
              <span className="font-bold">Permanent Audit Record: </span>
              This task is <strong>{task.status}</strong>. No further status changes, date modifications,
              or deletions are permitted per enterprise audit compliance rules.
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Permitted Transitions:</span>
              {allowedNext.length === 0 ? (
                <span className="text-xs text-slate-400 italic">None available</span>
              ) : (
                allowedNext.map((nextSt) => (
                  <button
                    key={nextSt}
                    onClick={() => setStatusModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <span>Advance to {nextSt}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              * Transitions are strictly managed exclusively through the <code>PUT /api/tasks/:id/status</code> endpoint.
            </p>
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      <TaskFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        task={task}
        onSaved={fetchTask}
      />

      {/* Status Transition Modal */}
      <TaskStatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        task={task}
        onStatusUpdated={fetchTask}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task Record"
        message={`Are you sure you want to permanently delete task ${task.taskId} ('${task.title}')?`}
        confirmText="Delete Task"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
