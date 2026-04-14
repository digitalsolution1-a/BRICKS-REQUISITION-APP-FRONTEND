import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Added for consistent UI feedback

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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Security Gate: If no token, bounce to login
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

      // Ensure role is exactly what the backend expects
      await axios.post(`${API_BASE_URL}/users/register`, formData, config);
      
      toast.success("PERSONNEL PROVISIONED SUCCESSFULLY", { id: loadingToast });
      
      // Reset form
      setFormData({ name: '', email: '', password: '', role: 'Staff', dept: 'Operations' });
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "ACCESS DENIED";
      toast.error(`PROVISIONING FAILED: ${errorMsg}`, { id: loadingToast });
      console.error("Registration Error:", err.response?.data);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-6 lg:p-12 uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate(-1)} // Go back to previous page
            className="text-[10px] font-black text-gray-400 hover:text-[#A67C52] tracking-widest flex items-center gap-2 transition-colors"
          >
            ← Back to Gateway
          </button>
          <h1 className="text-[#A67C52] text-2xl font-black tracking-tighter italic">SUPER <span className="text-black">ADMIN DASHBOARD</span></h1>
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
                      <th className="p-6">Manifest Status</th>
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
                        <td className="p-6">
                          <div className="flex items-center gap-2">
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
