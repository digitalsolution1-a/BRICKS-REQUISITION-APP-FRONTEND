import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// --- CORE COMPONENTS ---
import Login from './components/Login';
import RequisitionForm from './components/RequisitionForm';
import Dashboard from './components/Dashboard'; 
import StaffDashboard from './components/StaffDashboard'; 
import EditRequisition from './components/EditRequisition';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';

// --- ROLE-SPECIFIC DASHBOARDS ---
import HODDashboard from './components/HODDashboard'; 
import FCDashboard from './components/FCDashboard'; 
import MDDashboard from './components/MDDashboard'; 
import AccountantDashboard from './components/AccountantDashboard';

// --- ProtectedRoute: Standard Security ---
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0) {
    const userRole = user?.role?.trim().toUpperCase();
    const normalizedRoles = allowedRoles.map(role => role.toUpperCase());
    const hasAccess = user && normalizedRoles.includes(userRole);
    if (!hasAccess) return <Navigate to="/staff-dashboard" replace />;
  }

  return children;
};

// --- PublicRoute: Entry Logic ---
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
          {/* THE ENTRY POINT */}
          <Route path="/" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* STAFF ROUTES */}
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

          {/* ADDED EDIT ROUTE HERE - This prevents the auto-logout/redirect */}
          <Route path="/edit-requisition/:id" element={
            <ProtectedRoute>
              <EditRequisition />
            </ProtectedRoute>
          } />

          {/* MANAGEMENT & TREASURY ROUTES */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['HOD', 'FC', 'FINANCE CONTROLLER', 'MD', 'ACCOUNTANT', 'ADMIN']}>
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

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Fallback Catch-all */}
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
  const role = user?.role?.trim().toUpperCase();

  console.log("Bricks Portal - Detected Role:", role);

  switch (role) {
    case 'MD':
      return <MDDashboard />;
    case 'HOD':
      return <HODDashboard />;
    case 'FC':
    case 'FINANCE CONTROLLER':
    case 'FINANCIAL CONTROLLER':
    case 'FINANCE_CONTROLLER':
      return <FCDashboard />;
    case 'ACCOUNTANT':
    case 'ACCOUNTS':
    case 'TREASURY':
      return <AccountantDashboard />;
    case 'ADMIN':
      return <UserManagement />;
    default:
      return <Dashboard />;
  }
};

export default App;
