import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { API_BASE_URL } from '../../api/client';
import { useUrlState } from '../../hooks/useUrlState';
import { useToast } from '../../components/common/ToastContext';
import { SearchInput } from '../../components/common/SearchInput';
import { Pagination } from '../../components/common/Pagination';
import {
  StatusBadge,
  PriorityBadge,
  DepartmentBadge,
  OverdueBadge,
} from '../../components/common/Badge';
import { SkeletonTable, EmptyState, ErrorBanner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TaskFormModal } from './TaskFormModal';
import { TaskStatusChangeModal } from './TaskStatusChangeModal';
import {
  formatDate,
  DEPARTMENTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../utils/formatters';
import {
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

const DEFAULT_TASK_FILTERS = {
  search: '',
  department: '',
  priority: '',
  status: '',
  isOverdue: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

export function TaskListPage() {
  const { success, error: toastError } = useToast();

  const { state, updateState, resetFilters } = useUrlState(DEFAULT_TASK_FILTERS);

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [taskForStatusChange, setTaskForStatusChange] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Primitive values for stable dependencies
  const search = state.search || '';
  const department = state.department || '';
  const priority = state.priority || '';
  const status = state.status || '';
  const isOverdue = state.isOverdue || '';
  const sortBy = state.sortBy || 'createdAt';
  const sortOrder = state.sortOrder || 'desc';
  const page = state.page || 1;
  const limit = state.limit || 10;

  const fetchTasks = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);
      if (isOverdue) params.append('isOverdue', isOverdue);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await apiClient.get(`/tasks?${params.toString()}`);
      setTasks(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  }, [search, department, priority, status, isOverdue, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchChange = useCallback((val) => {
    updateState({ search: val }, true);
  }, [updateState]);

  const handleDepartmentChange = useCallback((val) => {
    updateState({ department: val }, true);
  }, [updateState]);

  const handlePriorityChange = useCallback((val) => {
    updateState({ priority: val }, true);
  }, [updateState]);

  const handleStatusChange = useCallback((val) => {
    updateState({ status: val }, true);
  }, [updateState]);

  const handleOverdueToggle = useCallback(() => {
    updateState({ isOverdue: isOverdue === 'true' ? '' : 'true' }, true);
  }, [isOverdue, updateState]);

  const handleSortChange = useCallback((field) => {
    if (sortBy === field) {
      updateState({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateState({ sortBy: field, sortOrder: field === 'priority' ? 'desc' : 'asc' });
    }
  }, [sortBy, sortOrder, updateState]);

  const handlePageChange = useCallback((newPage) => {
    updateState({ page: newPage });
  }, [updateState]);

  const handleLimitChange = useCallback((newLimit) => {
    updateState({ limit: newLimit }, true);
  }, [updateState]);

  const handleOpenAddModal = useCallback(() => {
    setSelectedTaskForEdit(null);
    setTaskFormOpen(true);
  }, []);

  const handleOpenEditModal = (task) => {
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      toastError(`Tasks in '${task.status}' status are immutable and cannot be edited.`);
      return;
    }
    setSelectedTaskForEdit(task);
    setTaskFormOpen(true);
  };

  const handleOpenStatusModal = (task) => {
    setTaskForStatusChange(task);
    setStatusModalOpen(true);
  };

  const handleOpenDelete = (task) => {
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      toastError(`Tasks with status '${task.status}' cannot be deleted as they are preserved historical records.`);
      return;
    }
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      setDeleting(true);
      const res = await apiClient.delete(`/tasks/${taskToDelete._id}`);
      success(res.data.message || 'Task deleted successfully');
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (state.search) params.append('search', state.search);
    if (state.department) params.append('department', state.department);
    if (state.priority) params.append('priority', state.priority);
    if (state.status) params.append('status', state.status);
    if (state.isOverdue) params.append('isOverdue', state.isOverdue);
    if (state.sortBy) params.append('sortBy', state.sortBy);
    if (state.sortOrder) params.append('sortOrder', state.sortOrder);

    const exportUrl = `${API_BASE_URL}/tasks/export?${params.toString()}`;
    window.open(exportUrl, '_blank');
  };

  const isFiltered =
    Boolean(state.search) ||
    Boolean(state.department) ||
    Boolean(state.priority) ||
    Boolean(state.status) ||
    Boolean(state.isOverdue);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-indigo-600 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Task Management</h2>
            {isFetching && !initialLoading && (
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor deliverables, enforce workflow state transitions, and track deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
            title="Export all matching tasks to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1">
            <SearchInput
              value={state.search || ''}
              onChange={handleSearchChange}
              placeholder="Search by title, task ID, assignee name..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department */}
            <select
              value={state.department || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={state.priority || ''}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
            >
              <option value="">All Priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={state.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm font-medium"
            >
              <option value="">All Statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Overdue Quick Toggle */}
            <button
              onClick={handleOverdueToggle}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                state.isOverdue === 'true'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 ${state.isOverdue === 'true' ? 'text-rose-600' : 'text-slate-400'}`}
              />
              <span>Overdue Only</span>
            </button>

            {/* Reset Filters */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchTasks} />}

      {/* Task Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {initialLoading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No tasks found"
            description={
              isFiltered
                ? 'No tasks matched your search or filter configuration.'
                : 'Get started by creating your first task assignment.'
            }
            actionText={isFiltered ? 'Clear Filters' : 'Create Task'}
            onAction={isFiltered ? resetFilters : handleOpenAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th
                    onClick={() => handleSortChange('taskId')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Task ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortChange('title')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Title</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6">Department</th>
                  <th
                    onClick={() => handleSortChange('priority')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6">Status & Transition</th>
                  <th
                    onClick={() => handleSortChange('employeeName')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Assignee</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortChange('dueDate')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tasks.map((task) => {
                  const isImmutable =
                    task.status === 'Completed' || task.status === 'Cancelled';
                  const assigneeName =
                    task.assignedEmployee?.fullName ||
                    task.assignedEmployeeSnapshot?.fullName ||
                    null;
                  const assigneeId =
                    task.assignedEmployee?.employeeId ||
                    task.assignedEmployeeSnapshot?.employeeId ||
                    null;
                  const isHistoricalSnapshot =
                    !task.assignedEmployee && task.assignedEmployeeSnapshot?.fullName;

                  return (
                    <tr
                      key={task._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        task.isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Task ID */}
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                        <Link to={`/tasks/${task._id}`} className="hover:text-brand-600">
                          {task.taskId}
                        </Link>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-6 max-w-xs">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 block truncate transition-colors"
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6">
                        <DepartmentBadge department={task.department} />
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-6">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Status & Transition Trigger */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={task.status} />
                          {!isImmutable && (
                            <button
                              onClick={() => handleOpenStatusModal(task)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors"
                              title="Advance Workflow Status"
                            >
                              Transition
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="py-4 px-6">
                        {assigneeName ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-800 text-xs">
                              {assigneeName}
                            </span>
                            {assigneeId && (
                              <span className="font-mono text-[11px] text-slate-400">
                                ({assigneeId})
                              </span>
                            )}
                            {isHistoricalSnapshot && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded border border-slate-200">
                                Archived
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date & Overdue Indicator */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-slate-600">
                            {formatDate(task.dueDate)}
                          </span>
                          {task.isOverdue && <OverdueBadge />}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            to={`/tasks/${task._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit button: disabled for completed/cancelled */}
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            disabled={isImmutable}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isImmutable
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                            title={isImmutable ? 'Completed/Cancelled tasks cannot be edited' : 'Edit Task'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button: disabled for completed/cancelled */}
                          <button
                            onClick={() => handleOpenDelete(task)}
                            disabled={isImmutable}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isImmutable
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={
                              isImmutable
                                ? 'Historical records cannot be deleted'
                                : 'Delete Task'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!initialLoading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        task={selectedTaskForEdit}
        onSaved={fetchTasks}
      />

      {/* Task Status Transition Modal */}
      <TaskStatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        task={taskForStatusChange}
        onStatusUpdated={fetchTasks}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task Record"
        message={
          taskToDelete
            ? `Are you sure you want to permanently delete task ${taskToDelete.taskId} ('${taskToDelete.title}')? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Task"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
