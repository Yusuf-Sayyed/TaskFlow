import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Layers,
  X,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">TaskFlow</span>
              <span className="text-xs font-semibold text-brand-400 ml-1 px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                PRO
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-6 mt-6 border-t border-slate-800">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Departments
            </p>
            <div className="space-y-1 text-xs text-slate-400 px-3">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-violet-400 mr-2"></span>Development</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-pink-400 mr-2"></span>Design</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>QA</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-teal-400 mr-2"></span>HR</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span>Sales</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Employee & Task System</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Enterprise Admin Portal</p>
        </div>
      </aside>
    </>
  );
}
