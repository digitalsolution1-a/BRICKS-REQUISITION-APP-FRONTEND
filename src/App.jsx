import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import RequisitionForm from './components/RequisitionForm';
import Dashboard from './components/Dashboard'; 
import MDDashboard from './components/MDDashboard'; 
import HODDashboard from './components/HODDashboard'; 
import StaffDashboard from './components/StaffDashboard'; 
import EditRequisition from './components/EditRequisition';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';

// --- ProtectedRoute: Standard Security ---
// This blocks unauthorized users from entering dashboards
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0) {
    const userRole = user?.role?.toUpperCase();
    const normalizedRoles = allowedRoles.map(role => role.toUpperCase());
    const hasAccess = user && normalizedRoles.includes(userRole);
    if (!hasAccess) return <Navigate to="/staff-dashboard" replace />;
  }

  return children;
};

// --- FIXED PublicRoute: The "Front Door" ---
// This no longer redirects. It just shows the Login page.
const PublicRoute = ({ children }) => {
  return children; 
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  return (
    <>
      <Toaster position="top-right" />

      <BrowserRouter>
        <Routes>
          {/* THE ENTRY POINT: Always shows Login first */}
          <Route path="/" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* --- PROTECTED STAFF ROUTES --- */}
          <Route path="/staff-dashboard" element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          } />

          <Route path="/submit-requisition" element={
            <ProtectedRoute>
              <RequisitionForm />
            </ProtectedRoute>
          } />

          {/* --- PROTECTED MANAGEMENT ROUTES --- */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['HOD', 'FC', 'MD', 'Accountant', 'Admin']}>
                <DashboardLogic />
              </ProtectedRoute>
            } 
          />

          <Route path="/approval-hub" element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HODDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          {/* Global Catch-all: Redirects lost users to Login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

/**
 * Traffic controller for management users.
 */
const DashboardLogic = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role?.toUpperCase();

  if (role === 'MD') return <MDDashboard />;
  if (role === 'HOD') return <HODDashboard />;
  
  return <Dashboard />;
};

export default App;
