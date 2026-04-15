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

  // Clean the base URL to prevent double slashes
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

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
      
      /** * BASED ON YOUR index.js:
       * Your backend listens at /api/users. 
       * If your routes/user.js uses router.get('/', ...), use `${API_BASE_URL}/users`
       * If your routes/user.js uses router.get('/manifest', ...), update the string below.
       */
      const requestPath = `${API_BASE_URL}/users`; 
      
      console.log(`📡 BRICKS SYSTEM: Syncing manifest from ${requestPath}`);
      
      const res = await axios.get(requestPath, config);
      // Ensure we handle both array responses and object responses containing arrays
      const userData = Array.isArray(res.data) ? res.data : res.data.users || [];
      setUsers(userData);
    } catch (err) {
      console.error("❌ MANIFEST SYNC ERROR:", err.response);
      
      if (err.response?.status === 404) {
        toast.error(`ROUTE NOT FOUND: ${err.config.url}`);
      } else if (err.response?.status === 403) {
        toast.error("ADMIN PRIVILEGES REQUIRED");
      } else {
        toast.error("OFFLINE: COULD NOT REACH DATABASE");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("PROVISIONING NEW PERSONNEL...");
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // We use the /api/users path as registered in your index.js
      const requestPath = `${API_BASE_URL}/users/register`;
      await axios.post(requestPath, formData, config);
      
      toast.success("ACCOUNT DEPLOYED TO MANIFEST", { id: loadingToast });
      setFormData({ name: '', email: '', password: '', role: 'Staff', dept: 'Operations' });
      fetchUsers();
    } catch (err) {
      console.error("PROVISIONING ERROR:", err.response?.data);
      const errorMsg = err.response?.data?.error || "CLEARANCE DENIED";
      toast.error(`DEPLOYMENT FAILED: ${errorMsg}`, { id: loadingToast });
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

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-4 lg:p-12 uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="text-[10px] font-black text-gray-400 hover:text-[#A67C52] tracking-widest flex items-center gap-2 transition-colors"
            >
              ← BACK
            </button>
            <h1 className="text-[#A67C52] text-xl font-black tracking-tighter italic">
              A <span className="text-black">dmin</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-green-700 tracking-widest">SYSTEM: NOMINAL</span>
            </div>

            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-transparent"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-gray-800">{user.name || 'AUTHORIZED ADMIN'}</p>
                <p className="text-[8px] font-bold text-[#A67C52] tracking-widest">PROFILE SETTINGS</p>
              </div>
              <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center text-white font-black text-xs">
                {user.name?.charAt(0) || 'A'}
              </div>
            </button>

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
              <h2 className="text-gray-800 font-black text-sm tracking-widest mb-6 border-b border-gray-50 pb-4 italic text-left">Account Provisioning</h2>
              <form onSubmit={handleCreateUser} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1">Legal Name</label>
                  <input 
                    name="name" value={formData.name} onChange={handleInputChange} required
                    placeholder="FULL NAME"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1">Work Email</label>
                  <input 
                    name="email" type="email" value={formData.email} onChange={handleInputChange} required
                    placeholder="EMAIL@BRICKS.COM"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 ml-1">Initial Password</label>
                  <input 
                    name="password" type="password" value={formData.password} onChange={handleInputChange} required
                    placeholder="••••••••"
                    className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Clearance</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold cursor-pointer outline-none">
                      <option value="Staff">STAFF</option>
                      <option value="HOD">HOD</option>
                      <option value="FC">FC</option>
                      <option value="MD">MD</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Dept</label>
                    <input 
                      name="dept" value={formData.dept} onChange={handleInputChange}
                      className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#A67C52]"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#A67C52] text-white font-black text-[10px] py-5 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 tracking-widest mt-4">
                  AUTHORIZE ACCOUNT
                </button>
              </form>
            </div>
          </div>

          {/* User List Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-gray-800 font-black text-sm tracking-widest uppercase italic">Personnel Manifest</h2>
                <span className="bg-orange-50 text-[#A67C52] text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">{users.length} SECURE RECORDS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 tracking-[0.2em]">
                    <tr>
                      <th className="p-6">Personnel</th>
                      <th className="p-6">Role</th>
                      <th className="p-6">Department</th>
                      <th className="p-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                       <tr><td colSpan="4" className="p-20 text-center animate-pulse font-black text-gray-300 text-xs italic tracking-widest">QUERYING BRICKS DATABASE...</td></tr>
                    ) : users.length === 0 ? (
                       <tr><td colSpan="4" className="p-20 text-center font-black text-gray-300 text-xs uppercase">No active records found in current manifest</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id} className="hover:bg-orange-50/10 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-gray-800 text-sm">{u.name}</p>
                          <p className="text-[10px] text-gray-400 lowercase italic">{u.email}</p>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                            u.role?.toUpperCase() === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-[#A67C52]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-black text-gray-500 tracking-tight">{u.dept}</td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                            <span className="text-[10px] font-black text-gray-400">ACTIVE</span>
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
