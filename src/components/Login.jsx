import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Specialist Tip: Centralize your API URL to match your Render deployment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Updated to use the cloud API URL
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      // Store token and user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect based on role
      if (res.data.user.role === 'Staff') {
        navigate('/submit-requisition');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Login Failed: Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        
        {/* HEADER: Light Brown #A67C52 Branding */}
        <div className="bg-[#A67C52] p-10 text-center">
          <h1 className="text-white text-4xl font-black tracking-tighter">BRICKS MURSTEN MATTONI</h1>
          <p className="text-orange-50 text-xs font-bold uppercase mt-2 tracking-[0.3em]">Requisition Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Corporate Email</label>
            <input 
              type="email" 
              required 
              autoComplete="email"
              className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-[#A67C52] outline-none p-3 transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure Password</label>
            <input 
              type="password" 
              required 
              autoComplete="current-password"
              className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-[#A67C52] outline-none p-3 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* BUTTON: Light Brown #A67C52 */}
          <button 
            disabled={loading}
            className="w-full bg-[#A67C52] hover:bg-[#8b6542] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
          
          <div className="pt-4 border-t border-gray-50">
            <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
              Bricks Digital Solutions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
