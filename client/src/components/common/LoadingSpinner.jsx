import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-brand-600 mb-2`} />
      {text && <p className="text-sm font-medium text-slate-500">{text}</p>}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full animate-pulse space-y-3 p-4">
      {/* Table Header Skeleton */}
      <div className="h-10 bg-slate-100 rounded-lg w-full mb-4"></div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex space-x-4 py-2 border-b border-slate-50">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-slate-100 rounded"
              style={{ width: `${Math.floor(100 / cols)}%` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        {Icon ? <Icon className="w-7 h-7 text-slate-400" /> : <AlertCircle className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all shadow-brand-500/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 mb-6 flex items-start justify-between shadow-sm">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-rose-900">Failed to load data</h4>
          <p className="text-xs text-rose-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
