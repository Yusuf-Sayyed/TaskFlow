import React from 'react';
import { Menu, Activity, ShieldCheck } from 'lucide-react';

export function Header({ onMenuClick, title = 'TaskFlow Pro' }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between transition-all">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* API Status badge */}
        <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          API Online
        </div>

        {/* System Mode badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Rules Enforced</span>
        </div>
      </div>
    </header>
  );
}
