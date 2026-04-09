import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

// Components
import Login from './components/Login';
import RequisitionForm from './components/RequisitionForm';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';

// Initialize Socket.io (Replace with your actual Render backend URL)
const socket = io("https://bricks-requisition-server.render.com", {
  autoConnect: false // We connect manually after login
});

// --- Improved ProtectedRoute ---
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/submit-requisition" replace />;
  }

  return children;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // 1. Socket.io Connection & Real-Time Listeners
    if (user) {
      socket.connect();
      socket.emit('join_room', user.role);
      // Also join a room for the specific user email for private alerts
      socket.emit('join_room', user.email); 
    }

    socket.on('new_requisition_alert', (data) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-bounce' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-8 border-[#003366]`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-[#003366]">{data.title}</p>
                <p className="mt-1 text-xs text-gray-600 font-medium">{data.message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-100">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-black uppercase text-[#003366] hover:bg-gray-50"
            >
              View
            </button>
          </div>
        </div>
      ), { duration: 8000 });
      
      // Play a subtle notification sound
      const audio = new Audio('/notify.mp3'); 
      audio.play().catch(e => console.log("Audio play blocked by browser"));
    });

    // 2. PWA Installation Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("⚓ BRICKS PWA: Install prompt stashed.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Request System Notification Permissions
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      socket.off('new_requisition_alert');
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <BrowserRouter>
      {/* Toast Container for Pop-up Alerts */}
      <Toaster position="top-right" />

      {/* PWA Floating Install Button */}
      {deferredPrompt && (
        <button 
          onClick={handleInstallApp}
          className="fixed bottom-8 right-8 z-[100] bg-[#003366] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-pulse border-2 border-blue-400 font-black text-xs uppercase tracking-widest transition-transform active:scale-95"
        >
          <span className="text-xl">📲</span> Install App
        </button>
      )}

      <Routes>
        <Route path="/" element={<Login />} />

        <Route 
          path="/submit-requisition" 
          element={
            <ProtectedRoute>
              <RequisitionForm />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
