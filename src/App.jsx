import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import RequisitionForm from './components/RequisitionForm';
import Dashboard from './components/Dashboard'; 
import StaffDashboard from './components/StaffDashboard'; 
import EditRequisition from './components/EditRequisition';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';

// --- Improved ProtectedRoute ---
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // 1. If not logged in, force to login page
  if (!token) return <Navigate to="/" replace />;

  // 2. Role-based Authorization
  if (allowedRoles.length > 0) {
    const hasAccess = user && allowedRoles.includes(user.role);
    if (!hasAccess) {
      // If they don't have management roles, send them to staff dashboard
      return <Navigate to="/staff-dashboard" replace />;
    }
  }

  return children;
};

// --- Redirect If Authenticated ---
// Prevents logged-in users from seeing the Login page
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (token && user) {
    const managementRoles = ['HOD', 'FC', 'MD', 'Accountant', 'Admin'];
    return managementRoles.includes(user.role) 
      ? <Navigate to="/dashboard" replace /> 
      : <Navigate to="/staff-dashboard" replace />;
  }
  return children;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("⚓ BRICKS PWA Install prompt stashed.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <BrowserRouter>
      {/* PWA Floating Install Button */}
      {deferredPrompt && (
        <button 
          onClick={handleInstallApp}
          className="fixed bottom-8 right-8 z-[100] bg-[#003366] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border-2 border-blue-400 font-black text-xs uppercase tracking-widest transition-transform active:scale-95"
        >
          <span className="text-xl">📲</span> Install BRICKS App
        </button>
      )}

      <Routes>
        {/* Public Entry Point (With Auth Check) */}
        <Route path="/" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* --- STAFF ROUTES --- */}
        <Route 
          path="/staff-dashboard" 
          element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/submit-requisition" 
          element={
            <ProtectedRoute>
              <RequisitionForm />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/edit-requisition/:id" 
          element={
            <ProtectedRoute>
              <EditRequisition />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* --- MANAGEMENT ROUTES --- */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['HOD', 'FC', 'MD', 'Accountant', 'Admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* Global Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
