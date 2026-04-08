import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      // Specialist Tip: Pointing to production Render URL
      const res = await axios.get(`${API_BASE_URL}/users`, config);
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      await axios.post(`${API_BASE_URL}/users/register`, formData, config);
      alert("✅ PERSONNEL PROVISIONED SUCCESSFULLY");
      setFormData({ name: '', email: '', password: '', role: 'Staff', dept: 'Operations' });
      fetchUsers();
    } catch (err) {
      alert("Provisioning failed: " + (err.response?.data?.error || "Error"));
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-[10px] font-black text-gray-400 hover:text-[#A67C52] uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            ← Back to Gateway
          </button>
          <h1 className="text-[#A67C52] text-2xl font-black tracking-tighter uppercase">Crew Provisioning</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Create User Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
              <h2 className="text-gray-800 font-black text-sm uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Add New Personnel</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Full Name</label>
                  <input 
                    name="name" value={formData.name} onChange={handleInputChange} required
                    placeholder="Enter full legal name"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Work Email</label>
                  <input 
                    name="email" type="email" value={formData.email} onChange={handleInputChange} required
                    placeholder="example@bricks.com"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Temporary Password</label>
                  <input 
                    name="password" type="password" value={formData.password} onChange={handleInputChange} required
                    placeholder="••••••••"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold cursor-pointer">
                      <option value="Staff">Staff</option>
                      <option value="HOD">HOD</option>
                      <option value="FC">FC</option>
                      <option value="MD">MD</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                      <option value="Admin">Admin (Super)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Department</label>
                    <input 
                      name="dept" value={formData.dept} onChange={handleInputChange}
                      className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52]"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#A67C52] text-white font-black text-xs py-5 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95 uppercase tracking-widest mt-4">
                  Deploy Account
                </button>
              </form>
            </div>
          </div>

          {/* User List Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-gray-800 font-black text-sm uppercase tracking-widest">Active Accounts</h2>
                <span className="bg-orange-50 text-[#A67C52] text-[10px] font-black px-3 py-1 rounded-full">{users.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="p-6">User Details</th>
                      <th className="p-6">Role</th>
                      <th className="p-6">Department</th>
                      <th className="p-6">Manifest Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                       <tr><td colSpan="4" className="p-20 text-center animate-pulse font-black text-gray-300 uppercase text-xs">Fetching Manifest...</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id} className="hover:bg-orange-50/10 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-gray-800 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400 lowercase italic">{u.email}</p>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-[#A67C52]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-tight">{u.dept}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">Verified</span>
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