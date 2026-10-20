import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Activity, ShieldCheck, ArrowLeft } from 'lucide-react';

export function Header({ onMenuClick, title = 'TaskFlow' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      if (location.pathname.startsWith('/tasks/')) navigate('/tasks');
      else if (location.pathname.startsWith('/employees/')) navigate('/employees');
      else navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between transition-all">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {!isHome && (
          <button
            onClick={handleBack}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            title="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

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
