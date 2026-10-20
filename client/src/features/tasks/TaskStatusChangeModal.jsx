import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import apiClient from '../../api/client';
import { ALLOWED_TRANSITIONS } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/Badge';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function TaskStatusChangeModal({ isOpen, onClose, task, onStatusUpdated }) {
  const { success, error: toastError } = useToast();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  if (!task) return null;

  const currentStatus = task.status;
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  const isFinalState = allowedNext.length === 0;

  const handleTransition = async () => {
    if (!selectedStatus) return;
    try {
      setSubmitting(true);
      setServerError(null);
      await apiClient.put(`/tasks/${task._id}/status`, { status: selectedStatus });
      success(`Task status transitioned to '${selectedStatus}'!`);
      onStatusUpdated();
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
      title={`Update Task Status — ${task.taskId}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {serverError}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Current Status
            </span>
            <StatusBadge status={currentStatus} />
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300" />
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Target Status
            </span>
            {selectedStatus ? (
              <StatusBadge status={selectedStatus} />
            ) : (
              <span className="text-xs text-slate-400 italic">Select below</span>
            )}
          </div>
        </div>

        {isFinalState ? (
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Final Status Reached: </span>
              Tasks in '{currentStatus}' status are permanently immutable and cannot be transitioned to any other status per Rule 3.
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Permitted Next Status:
            </label>
            <div className="space-y-2">
              {allowedNext.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {st === 'In Progress' && <Clock className="w-4 h-4 text-indigo-600" />}
                    {st === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {st === 'Cancelled' && <XCircle className="w-4 h-4 text-rose-600" />}
                    <span>{st}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-normal">
                    {st === 'Completed'
                      ? 'Sets completion date, locks record'
                      : st === 'Cancelled'
                      ? 'Terminates task, locks record'
                      : 'Active work in progress'}
                  </span>
                </button>
              ))}
            </div>

            {(selectedStatus === 'Completed' || selectedStatus === 'Cancelled') && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> Moving this task to <strong>{selectedStatus}</strong> is irreversible. Once confirmed, this task cannot be edited or reopened.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {!isFinalState && (
            <button
              type="button"
              onClick={handleTransition}
              disabled={!selectedStatus || submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Applying Transition...' : 'Confirm Transition'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
