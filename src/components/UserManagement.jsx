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

  // BASE URL cleanup: ensure no trailing slash
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      /** * ENDPOINT LOGIC:
       * backend/index.js mounts User routes at /api/users
       * backend/routes/user.js defines GET at /
       */
      const requestPath = `${API_BASE_URL}/users`; 
      
      const res = await axios.get(requestPath, config);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("SYNC ERROR:", err.response);
      const msg = err.response?.status === 403 ? "ADMIN ACCESS REQUIRED" : "FAILED TO FETCH PERSONNEL";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("PROVISIONING NEW ACCOUNT...");
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Path based on router.post('/register') in your user routes
      await axios.post(`${API_BASE_URL}/users/register`, formData, config);
      
      toast.success("PERSONNEL ADDED SUCCESSFULLY", { id: loadingToast });
      setFormData({ name: '', email: '', password: '', role: 'Staff', dept: 'Operations' });
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "PROVISIONING FAILED";
      toast.error(errorMsg, { id: loadingToast });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("CONFIRM: DECOMMISSION THIS ACCOUNT?")) return;
    const deleteToast = toast.loading("REMOVING FROM MANIFEST...");
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Path based on router.delete('/:id') in your user routes
      await axios.delete(`${API_BASE_URL}/users/${id}`, config);
      toast.success("ACCOUNT REMOVED", { id: deleteToast });
      fetchUsers();
    } catch (err) {
      toast.error("DELETION FAILED", { id: deleteToast });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("SESSION TERMINATED");
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-4 lg:p-12 uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER NAVIGATION --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)} 
              className="text-[10px] font-black text-gray-400 hover:text-[#A67C52] tracking-widest transition-colors"
            >
              ← BACK
            </button>
            <h1 className="text-[#A67C52] text-xl font-black italic">
              A<span className="text-black">dmin</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-gray-800">{user.name || 'AUTHORIZED USER'}</p>
              <p className="text-[8px] text-[#A67C52] font-bold tracking-widest">SYSTEM ADMINISTRATOR</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="px-6 py-3 bg-black text-white text-[10px] font-black rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-black/5"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 text-left">
          
          {/* --- PROVISIONING FORM --- */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 sticky top-8">
              <h2 className="text-gray-800 font-black text-xs tracking-widest mb-6 border-b border-gray-50 pb-4 italic">
                Personnel Provisioning
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-1">Full Legal Name</label>
                  <input 
                    name="name" value={formData.name} onChange={handleInputChange} 
                    placeholder="ENTER NAME" required
                    className="w-full mt-1 p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#A67C52] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-1">Corporate Email</label>
                  <input 
                    name="email" type="email" value={formData.email} onChange={handleInputChange} 
                    placeholder="EMAIL@BRICKS.COM" required
                    className="w-full mt-1 p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#A67C52] transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-1">Temporary Password</label>
                  <input 
                    name="password" type="password" value={formData.password} onChange={handleInputChange} 
                    placeholder="••••••••" required
                    className="w-full mt-1 p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#A67C52] transition-all" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 ml-1">Access Level</label>
                    <select 
                      name="role" value={formData.role} onChange={handleInputChange} 
                      className="w-full mt-1 p-4 bg-gray-50 rounded-2xl text-[10px] font-black cursor-pointer"
                    >
                      <option value="Staff">STAFF</option>
                      <option value="HOD">HOD</option>
                      <option value="FC">FC</option>
                      <option value="MD">MD</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 ml-1">Department</label>
                    <input 
                      name="dept" value={formData.dept} onChange={handleInputChange} 
                      placeholder="DEPT"
                      className="w-full mt-1 p-4 bg-gray-50 rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#A67C52]" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#A67C52] text-white font-black text-[10px] py-5 rounded-2xl hover:bg-black transition-all active:scale-95 tracking-[0.2em] shadow-lg shadow-[#A67C52]/20 mt-4"
                >
                  DEPLOY ACCOUNT
                </button>
              </form>
            </div>
          </div>

          {/* --- PERSONNEL TABLE --- */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                <h2 className="font-black text-xs tracking-widest text-gray-800">ACTIVE PERSONNEL MANIFEST</h2>
                <span className="text-[10px] font-black text-[#A67C52] bg-orange-50 px-4 py-1 rounded-full border border-orange-100">
                  {users.length} TOTAL RECORDS
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 tracking-widest">
                    <tr>
                      <th className="p-6">IDENTITY / CONTACT</th>
                      <th className="p-6">CLEARANCE</th>
                      <th className="p-6">DEPT</th>
                      <th className="p-6 text-right">OPERATIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="p-20 text-center font-black text-gray-300 animate-pulse italic tracking-widest">
                          SYNCING WITH BRICKS CLUSTER...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-20 text-center font-black text-gray-300 italic">
                          NO ACTIVE RECORDS DETECTED
                        </td>
                      </tr>
                    ) : users.map((u) => (
                      <tr key={u._id} className="hover:bg-orange-50/5 transition-colors group">
                        <td className="p-6">
                          <p className="font-black text-sm text-gray-800">{u.name}</p>
                          <p className="text-[10px] text-gray-400 lowercase italic tracking-tight">{u.email}</p>
                        </td>
                        <td className="p-6">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-lg tracking-widest ${
                            u.role?.toUpperCase() === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-orange-100 text-[#A67C52]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-black text-gray-500">{u.dept}</td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u._id)} 
                            className="text-[9px] font-black text-gray-300 hover:text-red-600 hover:scale-110 transition-all"
                          >
                            DECOMMISSION
                          </button>
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
