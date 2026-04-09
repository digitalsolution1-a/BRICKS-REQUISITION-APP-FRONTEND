import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';

const Dashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionComment, setActionComment] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';
  
  // 1. Pull user and normalize role for logic
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff' };
  const userRole = user.role ? user.role.toUpperCase() : 'STAFF';

  useEffect(() => {
    // 2. DEBUG LOG: Check your browser console (F12) to see what the app "thinks" you are.
    console.log("--- DEBUG: DASHBOARD SESSION ---");
    console.log("Logged User:", user.email);
    console.log("Current Role in LocalStorage:", user.role);
    console.log("Normalized Role:", userRole);
    console.log("--------------------------------");

    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending`, config);
      setRequisitions(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!actionComment.trim()) return alert("Audit comment is required.");
    
    const isMDOverride = userRole === 'MD' && selectedReq?.currentStage === 'FC';
    
    if (isMDOverride && action === 'Approved') {
      const confirm = window.confirm("ATTENTION: You are performing an FC Override. Continue?");
      if (!confirm) return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment: actionComment,
        actorRole: user.role,
        actorName: user.name,
        isOverride: isMDOverride || userRole === 'ADMIN'
      }, config);

      alert("Action completed.");
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Action failed"));
    }
  };

  // Logic for MD Oversight
  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  const fcPendingQueue = requisitions.filter(r => r.currentStage === 'FC');

  const renderTable = (data, title, accentColor, buttonLabel, isOverride = false) => (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${accentColor} shadow-sm`}></span> {title}
        </h3>
        <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
          {data.length} Pending
        </span>
      </div>
      <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
              <th className="p-8">Originator</th>
              <th className="p-8">Vendor / Description</th>
              <th className="p-8 text-right">Value</th>
              <th className="p-8 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((req) => (
              <tr key={req._id} className="hover:bg-gray-50/50 transition-all">
                <td className="p-8">
                  <p className="font-black text-gray-800 text-sm">{req.requesterName}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{req.department}</p>
                </td>
                <td className="p-8 text-sm font-bold text-gray-600">{req.vendorName}</td>
                <td className="p-8 text-right font-black text-[#A67C52] text-lg">
                  <span className="text-[10px] mr-1 opacity-40">{req.currency}</span>
                  {req.amount.toLocaleString()}
                </td>
                <td className="p-8 text-center">
                  <button 
                    onClick={() => setSelectedReq(req)} 
                    className={`text-[10px] font-black px-7 py-3 rounded-xl uppercase tracking-widest transition-all hover:scale-105 text-white shadow-md ${isOverride ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#A67C52] hover:bg-black'}`}
                  >
                    {isOverride ? 'Override FC' : buttonLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
              {userRole === 'MD' ? 'Executive Command' : 'Dashboard'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Bricks Mursten Mattoni Fleet</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                {/* 3. STRICT CASE-INSENSITIVE CHECK */}
                {userRole === 'ADMIN' && (
                  <button onClick={() => navigate('/admin/users')} className="text-[9px] font-black text-white bg-red-600 px-5 py-2.5 rounded-xl uppercase tracking-widest">Manage Users</button>
                )}
                {userRole === 'MD' && (
                  <button onClick={() => navigate('/reports')} className="text-[9px] font-black text-[#A67C52] bg-orange-50 px-5 py-2.5 rounded-xl uppercase tracking-widest border border-orange-100">System Analytics</button>
                )}
            </div>

            <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="text-right">
                <p className="font-black text-gray-800 text-xs leading-tight">{user.name}</p>
                <div className="flex gap-2 justify-end mt-0.5">
                   <button onClick={() => navigate('/profile')} className="text-[9px] text-gray-400 font-bold hover:text-[#A67C52] uppercase">Profile</button>
                   <span className="text-gray-200 text-[9px]">•</span>
                   <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[9px] text-red-500 font-bold hover:text-red-700 uppercase">Sign Out</button>
                </div>
              </div>
              <div className="h-10 w-10 bg-[#A67C52] rounded-xl flex items-center justify-center text-white font-black">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center text-[10px] font-black text-gray-300 uppercase animate-pulse">Syncing...</div>
        ) : (
          <>
            {userRole === 'MD' ? (
              <>
                {renderTable(mdPrimaryQueue, "Items Pending Your Approval", "bg-green-500", "Review & Sign")}
                {renderTable(fcPendingQueue, "FC Pending Approvals (Oversight)", "bg-blue-600", "Override FC", true)}
              </>
            ) : (
              renderTable(requisitions, "Action Queue", "bg-[#A67C52]", "Review File")
            )}
          </>
        )}

        {/* Action Modal Logic remains same but uses actionComment state */}
        {selectedReq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] max-w-5xl w-full p-16 shadow-2xl relative">
                <button onClick={() => setSelectedReq(null)} className="absolute top-10 right-10 text-2xl">✕</button>
                <h2 className="text-4xl font-black mb-8">{selectedReq.vendorName}</h2>
                <textarea 
                  className="w-full border p-4 rounded-xl mb-6" 
                  placeholder="Enter comment..." 
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                />
                <div className="flex gap-4">
                  <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold">Approve</button>
                  <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-red-50 text-red-600 py-4 rounded-xl font-bold">Decline</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
