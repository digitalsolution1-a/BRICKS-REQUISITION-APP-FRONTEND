import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    dept: 'Operations'
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Security Gate
  useEffect(() => {
    if (!token) {
      navigate('/');
    } else {
      fetchUsers();
    }
  }, [token, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const res = await axios.get(`${API_BASE_URL}/users`, config);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      toast.error("COULD NOT RETRIEVE USER MANIFEST");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("SESSION TERMINATED");
    navigate('/');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("PROVISIONING NEW ACCOUNT...");
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post(`${API_BASE_URL}/users/register`, formData, config);
      
      toast.success("PERSONNEL PROVISIONED SUCCESSFULLY", { id: loadingToast });
      setFormData({ name: '', email: '', password: '', role: 'Staff', dept: 'Operations' });
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "ACCESS DENIED";
      toast.error(`PROVISIONING FAILED: ${errorMsg}`, { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-4 lg:p-12 uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* --- TOP NAVIGATION BAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="text-[10px] font-black text-gray-400 hover:text-[#A67C52] tracking-widest flex items-center gap-2 transition-colors"
            >
              ← BACK
            </button>
            <h1 className="text-[#A67C52] text-xl font-black tracking-tighter italic">
              SUPER <span className="text-black">ADMIN PANEL</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert Button */}
            <button 
              onClick={() => toast("SYSTEM STATUS: NOMINAL", { icon: '🛡️' })}
              className="p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-all relative group"
            >
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile Link */}
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-gray-800 leading-none">{user.name || 'ADMIN'}</p>
                <p className="text-[8px] font-bold text-[#A67C52] tracking-widest">VIEW PROFILE</p>
              </div>
              <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center text-white font-black text-xs">
                {user.name?.charAt(0) || 'A'}
              </div>
            </button>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-black text-white text-[10px] font-black tracking-[0.2em] rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Create User Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
              <h2 className="text-gray-800 font-black text-sm tracking-widest mb-6 border-b border-gray-50 pb-4 italic">Add New Personnel</h2>
              <form onSubmit={handleCreateUser} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1">Full Name</label>
                  <input 
                    name="name" value={formData.name} onChange={handleInputChange} required
                    placeholder="ENTER FULL LEGAL NAME"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1">Work Email</label>
                  <input 
                    name="email" type="email" value={formData.email} onChange={handleInputChange} required
                    placeholder="EXAMPLE@BRICKS.COM"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1">Temporary Password</label>
                  <input 
                    name="password" type="password" value={formData.password} onChange={handleInputChange} required
                    placeholder="••••••••"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold cursor-pointer outline-none">
                      <option value="Staff">Staff</option>
                      <option value="HOD">HOD</option>
                      <option value="FC">FC</option>
                      <option value="MD">MD</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                      <option value="Admin">Admin (Super)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Department</label>
                    <input 
                      name="dept" value={formData.dept} onChange={handleInputChange}
                      className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52]"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#A67C52] text-white font-black text-[10px] py-5 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 tracking-widest mt-4">
                  DEPLOY ACCOUNT
                </button>
              </form>
            </div>
          </div>

          {/* User List Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-gray-800 font-black text-sm tracking-widest">Active Accounts</h2>
                <span className="bg-orange-50 text-[#A67C52] text-[10px] font-black px-3 py-1 rounded-full">{users.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 tracking-[0.2em]">
                    <tr>
                      <th className="p-6">User Details</th>
                      <th className="p-6">Role</th>
                      <th className="p-6">Department</th>
                      <th className="p-6 text-right">Manifest Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                       <tr><td colSpan="4" className="p-20 text-center animate-pulse font-black text-gray-300 text-xs">Fetching Manifest...</td></tr>
                    ) : users.length === 0 ? (
                       <tr><td colSpan="4" className="p-20 text-center font-black text-gray-300 text-xs">No users found</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id} className="hover:bg-orange-50/10 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-gray-800 text-sm">{u.name}</p>
                          <p className="text-[10px] text-gray-400 lowercase italic">{u.email}</p>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-[#A67C52]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-black text-gray-500 tracking-tight">{u.dept}</td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-gray-400">Verified</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserManagement;
