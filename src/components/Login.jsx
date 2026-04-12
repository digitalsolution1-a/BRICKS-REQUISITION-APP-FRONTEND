import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Verifying credentials...');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      // --- THE SAFETY INJECTION ---
      // We manually ensure 'email' is inside the user object before saving.
      const userWithEmail = {
        ...res.data.user,
        email: res.data.user.email || email // Fallback to the input state email
      };

      // Store token and the ENHANCED user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userWithEmail));

      const userRole = userWithEmail.role?.toUpperCase();
      const managementRoles = ['HOD', 'FC', 'MD', 'ACCOUNTANT', 'ADMIN'];

      toast.success(`Welcome back, ${userWithEmail.name || 'User'}!`, {
        id: loadingToast,
      });

      // REDIRECTION LOGIC:
      if (managementRoles.includes(userRole)) {
        navigate('/dashboard');
      } else {
        navigate('/staff-dashboard');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Login Failed: Please check your credentials.";
      toast.error(errorMsg, {
        id: loadingToast,
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
          {/* EMAIL FIELD */}
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

          {/* PASSWORD FIELD WITH TOGGLE */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Secure Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 pr-10 transition-all font-bold text-gray-700 text-sm"
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {/* EYE ICON TOGGLE */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#A67C52] transition-colors p-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.412 8.143 7.03 4.5 12 4.5c4.971 0 8.588 3.643 9.963 7.178.07.142.07.307 0 .449-1.375 3.535-4.992 7.178-9.963 7.178-4.971 0-8.588-3.643-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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
