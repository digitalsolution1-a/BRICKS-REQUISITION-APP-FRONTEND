import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  // Mode switcher: 'login' or 'change-password'
  const [mode, setMode] = useState('login'); 
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email verification, 2: Old password match & write

  // Baseline Authentication Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Self-Service Change Password Fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  // --- 1. CORE AUTHENTICATION LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Verifying credentials...');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      const userWithEmail = {
        ...res.data.user,
        email: res.data.user.email || email 
      };

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userWithEmail));

      const userRole = userWithEmail.role?.toUpperCase();
      const managementRoles = ['HOD', 'FC', 'MD', 'ACCOUNTANT', 'ADMIN'];

      toast.success(`Welcome back, ${userWithEmail.name || 'User'}!`, {
        id: loadingToast,
      });

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

  // --- 2. PASSWORD RECOVERY STEP 1: INITIAL ACCOUNT VERIFICATION ---
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    const fetchingToast = toast.loading('Validating identity profile...');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/recovery/get-question`, { email: recoveryEmail });
      setSecurityQuestion(res.data.question);
      setRecoveryStep(2);
      toast.dismiss(fetchingToast);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Account parameters or verification steps not configured for this user.";
      toast.error(errMsg, { id: fetchingToast });
    } finally {
      setLoading(false);
    }
  };

  // --- 3. PASSWORD RECOVERY STEP 2: VERIFY AND WRITE NEW PASSWORD ---
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    const savingToast = toast.loading('Updating security parameters...');
    setLoading(true);

    try {
      await axios.put(`${API_BASE_URL}/auth/recovery/reset`, {
        email: recoveryEmail,
        answer: oldPasswordInput, // Maps directly to backend verification 'answer'
        newPassword
      });

      toast.success("Password changed successfully! Please log in.", { id: savingToast });
      
      // Clean up local states and return to home login view
      setMode('login');
      setRecoveryStep(1);
      setOldPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.error || "Verification failed. Please crosscheck details.";
      toast.error(errMsg, { id: savingToast });
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
        
        {/* VIEW A: BASELINE LOGIN PANEL */}
        {mode === 'login' && (
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

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Password
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

            {/* INLINE PASS-THROUGH INTERFACE TRIGGER */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('change-password')}
                className="text-[10px] font-black text-[#A67C52] hover:text-black uppercase tracking-widest transition-colors duration-150"
              >
                Change Password?
              </button>
            </div>
            
            <div className="pt-8 border-t border-gray-50 flex flex-col items-center gap-2">
              <p className="text-gray-300 text-[8px] font-black uppercase tracking-widest">
                BRICKS DIGITAL SOLUTIONS
              </p>
              <div className="h-1 w-8 bg-gray-100 rounded-full"></div>
            </div>
          </form>
        )}

        {/* VIEW B: INTEGRATED SELF-SERVICE RECOVERY STRUCTURE */}
        {mode === 'change-password' && (
          <div className="p-10 space-y-6">
            <h2 className="text-[#A67C52] text-xl font-black tracking-tight uppercase">
              Account Password Reset
            </h2>

            {recoveryStep === 1 ? (
              <form onSubmit={handleFetchQuestion} className="space-y-5">
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Provide your official email.
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Corporate Email
                  </label>
                  <input 
                    type="email" 
                    required 
                    placeholder="e.example@brickslimited.com"
                    className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 transition-all font-bold text-gray-700 text-sm"
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full bg-[#A67C52] hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg mt-2"
                >
                  Verify Account
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest pt-1 block"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                {/* Instruction Banner from Server */}
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100/70">
                  <span className="text-[9px] font-black text-[#A67C52] uppercase block tracking-wider mb-1">
                    Security Verification Protocol
                  </span>
                  <p className="font-bold text-xs text-gray-700 italic leading-relaxed">
                    "{securityQuestion}"
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Old Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 transition-all font-bold text-gray-700 text-sm"
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 transition-all font-bold text-gray-700 text-sm"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-[#A67C52] outline-none p-3 transition-all font-bold text-gray-700 text-sm"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-[#A67C52] hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg mt-4"
                >
                  Save New Password
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setRecoveryStep(1); }}
                  className="w-full text-center text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest pt-1 block"
                >
                  Back to Sign In
                </button>
              </form>
            )}
            
            <div className="pt-4 border-t border-gray-50 flex flex-col items-center gap-2">
              <p className="text-gray-300 text-[8px] font-black uppercase tracking-widest">
                BRICKS DIGITAL SOLUTIONS
              </p>
              <div className="h-1 w-8 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
