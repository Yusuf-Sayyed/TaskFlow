import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

export function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    Inactive: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    Todo: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/10',
    'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
  };

  const icons = {
    Completed: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 inline" />,
    Cancelled: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600 inline" />,
    'In Progress': <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600 inline animate-spin-slow" />,
  };

  const currentStyle = styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ring-1 ring-inset ${currentStyle}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Critical: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  };

  const currentStyle = styles[priority] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}
    >
      {priority === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 inline-block" />}
      {priority}
    </span>
  );
}

export function DepartmentBadge({ department }) {
  const styles = {
    Development: 'bg-violet-50 text-violet-700 border-violet-200',
    Design: 'bg-pink-50 text-pink-700 border-pink-200',
    QA: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    HR: 'bg-teal-50 text-teal-700 border-teal-200',
    Sales: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const currentStyle = styles[department] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${currentStyle}`}>
      {department}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
      <AlertTriangle className="w-3 h-3 mr-1 text-red-600 inline" />
      Overdue
    </span>
  );
}
