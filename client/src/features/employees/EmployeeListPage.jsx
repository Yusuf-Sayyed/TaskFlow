import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { API_BASE_URL } from '../../api/client';
import { useUrlState } from '../../hooks/useUrlState';
import { useToast } from '../../components/common/ToastContext';
import { SearchInput } from '../../components/common/SearchInput';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge, DepartmentBadge } from '../../components/common/Badge';
import { SkeletonTable, EmptyState, ErrorBanner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmployeeFormModal } from './EmployeeFormModal';
import { formatDate, DEPARTMENTS, EMPLOYEE_STATUSES } from '../../utils/formatters';
import {
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  UserX,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

export function EmployeeListPage() {
  const { success, error: toastError } = useToast();

  const { state, updateState, resetFilters } = useUrlState({
    search: '',
    department: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (state.search) params.append('search', state.search);
      if (state.department) params.append('department', state.department);
      if (state.status) params.append('status', state.status);
      if (state.sortBy) params.append('sortBy', state.sortBy);
      if (state.sortOrder) params.append('sortOrder', state.sortOrder);
      params.append('page', String(state.page || 1));
      params.append('limit', String(state.limit || 10));

      const res = await apiClient.get(`/employees?${params.toString()}`);
      setEmployees(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchChange = (val) => {
    updateState({ search: val }, true); // resets to page 1
  };

  const handleDepartmentChange = (val) => {
    updateState({ department: val }, true);
  };

  const handleStatusChange = (val) => {
    updateState({ status: val }, true);
  };

  const handleSortChange = (field) => {
    if (state.sortBy === field) {
      updateState({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateState({ sortBy: field, sortOrder: 'asc' });
    }
  };

  const handlePageChange = (newPage) => {
    updateState({ page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    updateState({ limit: newLimit }, true);
  };

  const handleOpenAddModal = () => {
    setSelectedEmployee(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleting(true);
      const res = await apiClient.delete(`/employees/${employeeToDelete._id}`);
      success(res.data.message || 'Employee deleted successfully');
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
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
    if (state.status) params.append('status', state.status);
    if (state.sortBy) params.append('sortBy', state.sortBy);
    if (state.sortOrder) params.append('sortOrder', state.sortOrder);

    const exportUrl = `${API_BASE_URL}/employees/export?${params.toString()}`;
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage organization members, verify availability periods, and review workload capacity.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
            title="Export full matching dataset to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1">
            <SearchInput
              value={state.search || ''}
              onChange={handleSearchChange}
              placeholder="Search by name, employee ID..."
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-48">
            <select
              value={state.department || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={state.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
            >
              <option value="">All Statuses</option>
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {(state.search || state.department || state.status) && (
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

      {error && <ErrorBanner message={error} onRetry={fetchEmployees} />}

      {/* Employees Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="No employees found"
            description={
              state.search || state.department || state.status
                ? 'Try adjusting your search criteria or clearing active filters.'
                : 'Get started by creating your first employee profile.'
            }
            actionText={
              state.search || state.department || state.status ? 'Clear Filters' : 'Add Employee'
            }
            onAction={
              state.search || state.department || state.status ? resetFilters : handleOpenAddModal
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th
                    onClick={() => handleSortChange('employeeId')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortChange('fullName')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name & Role</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Status</th>
                  <th
                    onClick={() => handleSortChange('joiningDate')}
                    className="py-3 px-6 cursor-pointer hover:text-slate-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Joined</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6">Skills</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Employee ID */}
                    <td className="py-4 px-6 font-mono text-xs font-bold text-brand-700">
                      <Link to={`/employees/${emp._id}`} className="hover:underline">
                        {emp.employeeId}
                      </Link>
                    </td>

                    {/* Name, Email, Role */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {emp.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <Link
                            to={`/employees/${emp._id}`}
                            className="font-bold text-slate-900 hover:text-brand-600 block transition-colors"
                          >
                            {emp.fullName}
                          </Link>
                          <div className="text-xs text-slate-500 flex items-center space-x-2">
                            <span>{emp.role}</span>
                            <span>•</span>
                            <span className="text-slate-400">{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-6">
                      <DepartmentBadge department={emp.department} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <StatusBadge status={emp.status} />
                      {emp.status === 'On Leave' && emp.leaveStartDate && emp.leaveEndDate && (
                        <span className="block text-[11px] text-amber-700 mt-1">
                          {formatDate(emp.leaveStartDate)} – {formatDate(emp.leaveEndDate)}
                        </span>
                      )}
                    </td>

                    {/* Joining Date */}
                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(emp.joiningDate)}
                    </td>

                    {/* Skills */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.skills && emp.skills.length > 0 ? (
                          emp.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                        {emp.skills && emp.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          to={`/employees/${emp._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && (
          <Pagination
            page={state.page || 1}
            totalPages={totalPages}
            total={total}
            limit={state.limit || 10}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        employee={selectedEmployee}
        onSaved={fetchEmployees}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee Record"
        message={
          employeeToDelete
            ? `Are you sure you want to delete ${employeeToDelete.fullName} (${employeeToDelete.employeeId})? Note: Deletion will be rejected if the employee has any active tasks (Todo or In Progress). Historical tasks will preserve employee snapshots.`
            : ''
        }
        confirmText="Delete Employee"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
