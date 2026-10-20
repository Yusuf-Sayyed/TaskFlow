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

import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const [quickEmployeeModal, setQuickEmployeeModal] = useState(false);
  const [quickTaskModal, setQuickTaskModal] = useState(false);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <DashboardPage
                      onOpenCreateEmployee={() => setQuickEmployeeModal(true)}
                      onOpenCreateTask={() => setQuickTaskModal(true)}
                    />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/employees"
                element={
                  <ErrorBoundary>
                    <EmployeeListPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/employees/:id"
                element={
                  <ErrorBoundary>
                    <EmployeeDetailsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ErrorBoundary>
                    <TaskListPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <ErrorBoundary>
                    <TaskDetailsPage />
                  </ErrorBoundary>
                }
              />
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
  </ErrorBoundary>
  );
}
