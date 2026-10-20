import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EmployeeListPage } from './features/employees/EmployeeListPage';
import { EmployeeDetailsPage } from './features/employees/EmployeeDetailsPage';
import { TaskListPage } from './features/tasks/TaskListPage';
import { TaskDetailsPage } from './features/tasks/TaskDetailsPage';
import { EmployeeFormModal } from './features/employees/EmployeeFormModal';
import { TaskFormModal } from './features/tasks/TaskFormModal';

export default function App() {
  const [quickEmployeeModal, setQuickEmployeeModal] = useState(false);
  const [quickTaskModal, setQuickTaskModal] = useState(false);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <DashboardPage
                  onOpenCreateEmployee={() => setQuickEmployeeModal(true)}
                  onOpenCreateTask={() => setQuickTaskModal(true)}
                />
              }
            />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/:id" element={<TaskDetailsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* Global Quick Modals triggered from dashboard */}
        <EmployeeFormModal
          isOpen={quickEmployeeModal}
          onClose={() => setQuickEmployeeModal(false)}
          onSaved={() => window.location.reload()}
        />

        <TaskFormModal
          isOpen={quickTaskModal}
          onClose={() => setQuickTaskModal(false)}
          onSaved={() => window.location.reload()}
        />
      </BrowserRouter>
    </ToastProvider>
  );
}
