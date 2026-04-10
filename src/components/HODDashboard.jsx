import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state
  
  // Robust way to get user and API URL
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  useEffect(() => {
    const fetchRequisitions = async () => {
      console.log("🚀 Starting fetch for:", user.email); // Debug log
      
      try {
        if (!user.email) {
          throw new Error("User email not found in local storage");
        }

        const res = await axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ Data received:", res.data);
        setRequisitions(res.data);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError(err.message);
      } finally {
        // This MUST run to remove the "Syncing..." message
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, [user.email, API_BASE_URL, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#A67C52] mb-4"></div>
        <p className="font-black text-[#A67C52] tracking-widest uppercase animate-pulse">Syncing HOD Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500 font-bold uppercase tracking-widest">
        Error Loading Dashboard: {error}
        <button onClick={() => window.location.reload()} className="block mx-auto mt-4 bg-gray-200 p-2 rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 uppercase">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">HOD Dashboard</h1>
            <p className="text-[#A67C52] font-black text-[10px] tracking-[0.3em] mt-2">HOD Internal Review</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400">Logged in as</p>
            <p className="font-black text-xs">{user.name}</p>
          </div>
        </header>

        {requisitions.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-4 border-dashed border-gray-100">
            <p className="font-black text-gray-300 tracking-widest text-sm">Everything is clear. No pending approvals.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requisitions.map((req) => (
              <div key={req._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 transition-transform hover:scale-[1.01]">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#A67C52] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{req.department}</span>
                    <span className="text-gray-400 text-[10px] font-bold tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-none">{req.requesterName}</h3>
                  <p className="text-xs font-black text-gray-500 mb-4">{req.vendorName} — {req.requestType}</p>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 leading-relaxed italic line-clamp-2">"{req.requestNarrative}"</p>
                  </div>
                </div>

                <div className="text-right px-10 border-x border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-2">Total Payable</p>
                  <p className="text-3xl font-black text-[#A67C52] leading-none">{req.currency} {req.amount?.toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleAction(req._id, 'Approved')} 
                    className="bg-[#A67C52] text-white px-10 py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-black transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(req._id, 'Declined')} 
                    className="bg-white border-2 border-red-50 text-red-500 px-10 py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-red-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
