import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Specialist Tip: Centralize your API URL to match your Render deployment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff', dept: 'N/A', email: 'N/A' };

  useEffect(() => {
    fetchMyHistory();
  }, []);

  const fetchMyHistory = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      // Fetching from production Render URL
      const res = await axios.get(`${API_BASE_URL}/requisitions/user/${user.email}`, config);
      setMyRequests(res.data);
    } catch (err) {
      console.error("History Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-8 text-[10px] font-black text-gray-400 hover:text-[#A67C52] uppercase tracking-[0.2em] flex items-center gap-2"
        >
          ← Return to Station
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* User ID Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 text-center">
              {/* Branding Color Updated to #A67C52 */}
              <div className="h-24 w-24 bg-[#A67C52] rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-inner mb-6">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-gray-800 tracking-tighter">{user.name}</h2>
              <p className="text-[10px] font-black text-[#A67C52] uppercase tracking-widest mt-1">{user.role} • {user.dept}</p>
              
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-4 text-left">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-gray-700">{user.email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Access</p>
                  <p className="text-sm font-bold text-gray-700">Verified Personnel</p>
                </div>
              </div>

              <button 
                onClick={() => { localStorage.clear(); window.location.href='/'; }}
                className="w-full mt-8 bg-red-50 text-red-500 font-black text-[10px] py-4 rounded-2xl hover:bg-red-100 transition-colors uppercase tracking-widest"
              >
                Terminate Session
              </button>
            </div>
          </div>

          {/* Personal Activity History */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h3 className="text-gray-800 font-black text-xs uppercase tracking-widest">Your Submission History</h3>
                <span className="text-[10px] font-black text-gray-400">{myRequests.length} Requests</span>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-20 text-center animate-pulse text-gray-300 font-black text-xs uppercase">Loading Logs...</div>
                ) : myRequests.length > 0 ? (
                  myRequests.map((req) => (
                    <div key={req._id} className="p-6 border-b border-gray-50 hover:bg-orange-50/20 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-black text-gray-800 text-sm">{req.vendorName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                          {new Date(req.createdAt).toLocaleDateString()} • {req.currency} {req.amount.toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        req.status === 'Paid' ? 'bg-green-100 text-green-600' : 
                        req.status === 'Declined' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#A67C52]'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center italic text-gray-300 font-black text-[10px] uppercase tracking-[0.3em]">
                    No activity recorded in the manifest
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;