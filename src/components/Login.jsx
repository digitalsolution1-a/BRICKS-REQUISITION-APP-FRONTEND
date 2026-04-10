import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Import toast for professional notifications

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Specialist Tip: Ensure your VITE_API_BASE_URL is set in Vercel/Render environment settings
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Create a loading toast and store its ID to update it later
    const loadingToast = toast.loading('Verifying credentials...');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      // Store token and user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const userRole = res.data.user.role;
      const managementRoles = ['HOD', 'FC', 'MD', 'Accountant', 'Admin'];

      // Success Notification
      toast.success(`Welcome back, ${res.data.user.name || 'User'}!`, {
        id: loadingToast, // This replaces the loading toast
      });

      // REDIRECTION LOGIC:
      if (managementRoles.includes(userRole)) {
        navigate('/dashboard');
      } else {
        navigate('/staff-dashboard');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Login Failed: Please check your credentials.";
      
      // Error Notification
      toast.error(errorMsg, {
        id: loadingToast, // This replaces the loading toast
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        
        {/* HEADER: Corporate Branding */}
        <div className="bg-[#A67C52] p-10 text-center">
          <h1 className="text-white text-3xl font-black tracking-tighter uppercase leading-tight">
            Bricks Mursten Mattoni
          </h1>
          <p className="text-orange-50 text-[9px] font-black uppercase mt-2 tracking-[0.4em] opacity-80">
            Requisition Portal
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Corporate Email
            </label>
            <input 
              type="email" 
              required 
              autoComplete="email"
              placeholder="e.example@brickslimited.com"
              className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 transition-all font-bold text-gray-700 text-sm"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Secure Password
            </label>
            <input 
              type="password" 
              required 
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 transition-all font-bold text-gray-700 text-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#A67C52] hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
          
          <div className="pt-8 border-t border-gray-50 flex flex-col items-center gap-2">
            <p className="text-gray-300 text-[8px] font-black uppercase tracking-widest">
              BRICKS DIGITAL SOLUTIONS
            </p>
            <div className="h-1 w-8 bg-gray-100 rounded-full"></div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
