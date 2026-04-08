import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (currentUser?.role !== 'Admin') {
      navigate('/dashboard');
    } else {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const res = await axios.get('http://127.0.0.1:5000/api/users', config);
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-[#003366] text-[10px] font-black uppercase mb-2 block tracking-widest">← Back to Gateway</button>
            <h1 className="text-[#003366] text-4xl font-black uppercase tracking-tighter">Personnel Registry</h1>
          </div>
          <div className="bg-[#003366] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
            Total Users: {users.length}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 animate-pulse font-black text-gray-400 uppercase text-xs">Accessing BRICKS Personnel Data...</div>
        ) : (
          <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                  <th className="p-8">Full Name</th>
                  <th className="p-8">Official Email</th>
                  <th className="p-8">Designated Role</th>
                  <th className="p-8 text-center">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-8 font-black text-gray-800">{u.name}</td>
                    <td className="p-8 text-sm text-gray-500">{u.email}</td>
                    <td className="p-8">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                        u.role === 'HOD' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-8 text-center">
                      <button className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-tighter">Reset Access</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;