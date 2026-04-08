import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import RequisitionForm from './components/RequisitionForm';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';

// Function to protect routes based on Auth and Roles
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // If authenticated but not authorized for this specific area, redirect to requisition form
    return <Navigate to="/submit-requisition" replace />;
  }

  return children;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. PWA Installation Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("⚓ BRICKS PWA Install prompt stashed.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 2. Request System Notification Permissions
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          console.log("Notification permission:", permission);
        });
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
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
        {/* Public Entry Point */}
        <Route path="/" element={<Login />} />

        {/* Global Authenticated Route: Submission Form */}
        <Route 
          path="/submit-requisition" 
          element={
            <ProtectedRoute>
              <RequisitionForm />
            </ProtectedRoute>
          } 
        />

        {/* Global Authenticated Route: Personal Profile & History */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* Management Route: Approval Gateway (Restricted to Management Roles) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['HOD', 'FC', 'MD', 'ACCOUNTS', 'Admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Super Admin Route: User & Personnel Management (Admin Only) */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* Global Catch-all: Redirect to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;