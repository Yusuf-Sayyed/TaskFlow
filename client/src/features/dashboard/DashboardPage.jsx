import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CalendarOff,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, OverdueBadge, DepartmentBadge } from '../../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

export function DashboardPage({ onOpenCreateTask, onOpenCreateEmployee }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return <LoadingSpinner text="Aggregating workspace analytics..." />;
  }

  if (error && !stats) {
    return <ErrorBanner message={error} onRetry={fetchStats} />;
  }

  const {
    totalEmployees = 0,
    activeEmployees = 0,
    onLeaveEmployees = 0,
    totalTasks = 0,
    todoTasks = 0,
    inProgressTasks = 0,
    completedTasks = 0,
    cancelledTasks = 0,
    overdueTasks = 0,
    recentTasks = [],
    tasksByDepartment = [],
  } = stats || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow decorative effect */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-3">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Operations Overview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Performance Hub</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real-time tracking of employee assignments, capacity thresholds, and task delivery pipelines.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenCreateEmployee}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalEmployees}</span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {activeEmployees} Active
              </span>
              {onLeaveEmployees > 0 && (
                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {onLeaveEmployees} On Leave
                </span>
              )}
            </div>
          </div>
          <Link
            to="/employees"
            className="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Manage employees</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalTasks}</span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span className="text-sky-600 font-bold">{todoTasks}</span> Todo •{' '}
              <span className="text-indigo-600 font-bold">{inProgressTasks}</span> In Progress
            </div>
          </div>
          <Link
            to="/tasks"
            className="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>View all tasks</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {/* Completed Delivery */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{completedTasks}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% Completion
            </span>
          </div>
          <Link
            to="/tasks?status=Completed"
            className="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Archived completions</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {/* Overdue Alerts */}
        <div
          className={`rounded-2xl p-6 border shadow-sm transition-shadow ${
            overdueTasks > 0
              ? 'bg-rose-50/60 border-rose-200 hover:shadow-md'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Overdue Bottlenecks</span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                overdueTasks > 0 ? 'bg-rose-100 text-rose-600 animate-bounce' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${overdueTasks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueTasks}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                overdueTasks > 0
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {overdueTasks > 0 ? 'Requires Action' : 'All On Track'}
            </span>
          </div>
          <Link
            to="/tasks?isOverdue=true"
            className="mt-4 inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            <span>Resolve overdue items</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>

      {/* Secondary Status Breakdown & Department Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Task Pipeline Status</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution across execution lifecycle</p>

            <div className="space-y-4">
              {/* Todo */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-2"></span>Todo</span>
                  <span>{todoTasks} ({totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* In Progress */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-2"></span>In Progress</span>
                  <span>{inProgressTasks} ({totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Completed */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>Completed</span>
                  <span>{completedTasks} ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Cancelled */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-2"></span>Cancelled</span>
                  <span>{cancelledTasks} ({totalTasks > 0 ? Math.round((cancelledTasks / totalTasks) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (cancelledTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Enforced transition rule</span>
            <span className="font-semibold text-brand-600">Strict State Machine</span>
          </div>
        </div>

        {/* Tasks by Department */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Department Allocation</h3>
            <p className="text-xs text-slate-400 mb-4">Task volume by business unit</p>

            <div className="space-y-3">
              {['Development', 'Design', 'QA', 'HR', 'Sales'].map((dept) => {
                const found = tasksByDepartment.find((d) => d._id === dept);
                const count = found ? found.count : 0;
                const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

                return (
                  <div key={dept} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center space-x-2">
                      <DepartmentBadge department={dept} />
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-bold text-slate-800">{count} tasks</span>
                      <span className="text-slate-400 w-10 text-right">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            Max active capacity: 3 active tasks per employee
          </div>
        </div>

        {/* Workforce Availability Overview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Workforce Availability</h3>
            <p className="text-xs text-slate-400 mb-4">Availability for new assignments</p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">Active Staff</h4>
                    <p className="text-[11px] text-emerald-700">Eligible for assignments</p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-emerald-900">{activeEmployees}</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <CalendarOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">On Leave</h4>
                    <p className="text-[11px] text-amber-700">Unavailable during leave period</p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-amber-900">{onLeaveEmployees}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/employees"
              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <span>View Employee Directory</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Task Activity</h3>
            <p className="text-xs text-slate-400">Latest task creations and updates</p>
          </div>
          <Link
            to="/tasks"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center"
          >
            <span>Explore all tasks</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Task ID</th>
                <th className="py-3 px-6">Title</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Assignee</th>
                <th className="py-3 px-6">Priority</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    No recent tasks found.
                  </td>
                </tr>
              ) : (
                recentTasks.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-700">
                      <Link to={`/tasks/${t._id}`} className="hover:text-brand-600">
                        {t.taskId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900 max-w-xs truncate">
                      <Link to={`/tasks/${t._id}`} className="hover:text-brand-600">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-6">
                      <DepartmentBadge department={t.department} />
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">
                      {t.assignedEmployee?.fullName ||
                        t.assignedEmployeeSnapshot?.fullName || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                    </td>
                    <td className="py-3.5 px-6">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(t.dueDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
