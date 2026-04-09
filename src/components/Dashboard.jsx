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
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff' };
  const userRole = user.role ? user.role.toUpperCase() : 'STAFF';

  useEffect(() => {
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
    
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment: actionComment,
        actorRole: user.role,
        actorName: user.name,
        isOverride: isOverride || userRole === 'ADMIN'
      }, config);

      alert("Action completed.");
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Action failed"));
    }
  };

  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  const fcPendingQueue = requisitions.filter(r => r.currentStage === 'FC');

  const renderContent = (data, title, accentColor, buttonLabel, isOverride = false) => (
    <div className="mb-10 lg:mb-14">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-gray-400 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accentColor}`}></span> {title}
        </h3>
        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
          {data.length}
        </span>
      </div>

      {/* MOBILE CARD VIEW (Visible on small screens) */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {data.map((req) => (
          <div key={req._id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-black text-gray-900 text-sm">{req.requesterName}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{req.department}</p>
              </div>
              <p className="font-black text-[#A67C52] text-md">
                <span className="text-[10px] mr-1 opacity-50">{req.currency}</span>
                {req.amount.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-600 mb-4 font-medium">{req.vendorName}</p>
            <button 
              onClick={() => setSelectedReq(req)}
              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-transform active:scale-95 ${isOverride ? 'bg-blue-600' : 'bg-[#A67C52]'}`}
            >
              {isOverride ? 'Override FC' : buttonLabel}
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW (Visible on LG screens) */}
      <div className="hidden lg:block bg-white shadow-xl rounded-[2.5rem] overflow-hidden border border-gray-100">
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
                  <button onClick={() => setSelectedReq(req)} className={`text-[10px] font-black px-7 py-3 rounded-xl uppercase tracking-widest text-white ${isOverride ? 'bg-blue-600' : 'bg-[#A67C52]'}`}>
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
    <div className="min-h-screen bg-[#fcfcfc] p-4 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Responsive Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 lg:mb-16 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 uppercase tracking-tighter">
              {userRole === 'MD' ? 'Executive Command' : 'Dashboard'}
            </h1>
            <p className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1 lg:mt-2">Bricks Mursten Mattoni Ltd. Requestion</p>
          </div>

          <div className="flex items-center justify-between w-full lg:w-auto gap-4 lg:gap-6">
            <div className="flex gap-2">
              {userRole === 'ADMIN' && (
                <button onClick={() => navigate('/admin/users')} className="text-[8px] lg:text-[9px] font-black text-white bg-red-600 px-4 py-2 rounded-lg uppercase">Users</button>
              )}
              {userRole === 'MD' && (
                <button onClick={() => navigate('/reports')} className="text-[8px] lg:text-[9px] font-black text-[#A67C52] bg-orange-50 px-4 py-2 rounded-lg uppercase border border-orange-100">Reports</button>
              )}
            </div>

            <div className="flex items-center gap-3 bg-white p-1 pr-3 lg:pr-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="h-8 w-8 lg:h-10 lg:w-10 bg-[#A67C52] rounded-xl flex items-center justify-center text-white font-black text-xs">
                {user.name?.charAt(0)}
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-black text-gray-800 text-[10px] lg:text-xs leading-tight">{user.name}</p>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[8px] lg:text-[9px] text-red-500 font-bold uppercase">Logout</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] font-black text-gray-300 uppercase animate-pulse">Syncing...</div>
        ) : (
          <>
            {userRole === 'MD' ? (
              <>
                {renderContent(mdPrimaryQueue, "Items Pending Your Approval", "bg-green-500", "Review & Sign")}
                {renderContent(fcPendingQueue, "FC Oversight Log", "bg-blue-600", "Override", true)}
              </>
            ) : (
              renderContent(requisitions, "Requisition Queue", "bg-[#A67C52]", "Process")
            )}
          </>
        )}
      </div>

      {/* MOBILE FRIENDLY MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[999] flex items-end lg:items-center justify-center">
          <div className="bg-white w-full max-w-4xl rounded-t-[2.5rem] lg:rounded-[3rem] p-8 lg:p-16 relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedReq(null)} className="absolute top-6 right-8 text-xl font-bold lg:top-10 lg:right-10">✕</button>
            
            <div className="mb-6 lg:mb-10">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Processing Request</p>
                <h2 className="text-2xl lg:text-4xl font-black text-gray-900 leading-tight">{selectedReq.vendorName}</h2>
                <p className="text-lg lg:text-2xl font-black text-[#A67C52] mt-2">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
            </div>

            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Audit Comment</label>
            <textarea 
              className="w-full border border-gray-100 bg-gray-50 p-4 rounded-2xl mb-8 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/20 text-sm" 
              rows="4"
              placeholder="Provide reason for approval/decline..." 
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
            />

            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 pb-6">
              <button 
                onClick={() => handleAction(selectedReq._id, 'Approved')} 
                className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
              >
                Confirm Approval
              </button>
              <button 
                onClick={() => handleAction(selectedReq._id, 'Declined')} 
                className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
