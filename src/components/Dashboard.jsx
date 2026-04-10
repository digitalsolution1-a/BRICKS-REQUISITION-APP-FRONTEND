import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionComment, setActionComment] = useState("");
  const navigate = useNavigate();

  // Ensuring we use the correct environment variable for your deployment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff' };
  const userRole = user.role ? user.role.toUpperCase() : 'STAFF';

  useEffect(() => {
    fetchPendingRequests();
  }, [userRole]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      
      // We pass the role and email to the backend to leverage our case-insensitive filtering
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/${user.role}?email=${user.email}`, config);
      setRequisitions(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!actionComment.trim()) return alert("An audit comment is required for transparency.");
    
    // Logic: MD can override FC, or Admin has general override powers
    const isOverride = (userRole === 'MD' && selectedReq?.currentStage === 'FC') || userRole === 'ADMIN';
    
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment: actionComment,
        actorRole: user.role,
        actorName: user.name,
        isOverride: isOverride 
      }, config);

      alert(`Requisition successfully ${action.toLowerCase()}.`);
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Action failed"));
    }
  };

  // Splitting queues for Executive View (MD)
  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  const fcPendingQueue = requisitions.filter(r => r.currentStage === 'FC');

  const renderContent = (data, title, accentColor, buttonLabel, isOverrideView = false) => (
    <div className="mb-10 lg:mb-14">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-gray-400 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accentColor}`}></span> {title}
        </h3>
        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
          {data.length}
        </span>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {data.map((req) => (
          <div key={req._id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-black text-gray-900 text-sm">{req.requesterName}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{req.department}</p>
              </div>
              <p className="font-black text-[#A67C52] text-md">
                <span className="text-[10px] mr-1 opacity-50">{req.currency}</span>
                {req.amount.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-600 mb-5 font-medium leading-relaxed">{req.vendorName}</p>
            <button 
              onClick={() => setSelectedReq(req)}
              className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-[0.98] ${isOverrideView ? 'bg-blue-600' : 'bg-[#A67C52]'}`}
            >
              {isOverrideView ? 'Override FC' : buttonLabel}
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
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
                <td className="p-8 text-sm font-bold text-gray-600 uppercase text-xs">{req.vendorName}</td>
                <td className="p-8 text-right font-black text-[#A67C52] text-lg">
                  <span className="text-[10px] mr-1 opacity-40">{req.currency}</span>
                  {req.amount.toLocaleString()}
                </td>
                <td className="p-8 text-center">
                  <button onClick={() => setSelectedReq(req)} className={`text-[10px] font-black px-7 py-3 rounded-xl uppercase tracking-widest text-white ${isOverrideView ? 'bg-blue-600' : 'bg-[#A67C52]'}`}>
                    {isOverrideView ? 'Override FC' : buttonLabel}
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
    <div className="min-h-screen bg-[#fcfcfc] p-4 lg:p-12 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 lg:mb-16 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 uppercase tracking-tighter">
              {userRole === 'MD' ? 'Executive Command' : 'Approval Hub'}
            </h1>
            <p className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1 lg:mt-2">Bricks Mursten Mattoni Ltd.</p>
          </div>

          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            <div className="flex gap-2">
              {userRole === 'ADMIN' && (
                <button onClick={() => navigate('/admin/users')} className="text-[8px] lg:text-[9px] font-black text-white bg-red-600 px-4 py-2 rounded-lg uppercase shadow-sm">Users</button>
              )}
              {userRole === 'MD' && (
                <button onClick={() => navigate('/reports')} className="text-[8px] lg:text-[9px] font-black text-[#A67C52] bg-white px-4 py-2 rounded-lg uppercase border border-gray-100 shadow-sm">Analytics</button>
              )}
            </div>

            <div className="flex items-center gap-3 bg-white p-1 pr-3 lg:pr-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="h-8 w-8 lg:h-10 lg:w-10 bg-[#A67C52] rounded-xl flex items-center justify-center text-white font-black text-xs uppercase">
                {user.name?.charAt(0)}
              </div>
              <div className="text-right">
                <p className="font-black text-gray-800 text-[10px] leading-tight">{user.name}</p>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[8px] text-red-500 font-bold uppercase block">Logout</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] font-black text-gray-300 uppercase animate-pulse">Syncing Bricks Cloud...</div>
        ) : (
          <>
            {userRole === 'MD' ? (
              <>
                {renderContent(mdPrimaryQueue, "Items Pending Your Approval", "bg-green-500", "Review & Sign")}
                {fcPendingQueue.length > 0 && renderContent(fcPendingQueue, "FC Oversight Log", "bg-blue-600", "Review Override", true)}
              </>
            ) : (
              renderContent(requisitions, "Requisition Queue", "bg-[#A67C52]", "Process Request")
            )}
            
            {requisitions.length === 0 && (
              <div className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Queue is clear</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ACTION MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[2rem] lg:rounded-[2.5rem] p-8 lg:p-12 relative animate-slide-up max-h-[95vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setSelectedReq(null)} className="absolute top-6 right-8 text-gray-400 hover:text-black transition-colors">
               <span className="text-xl font-bold">✕</span>
            </button>
            
            <div className="mb-8">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Requisition Detail</p>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight uppercase">{selectedReq.vendorName}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <p className="text-xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
                  <span className="text-[8px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase tracking-tighter">
                    Current Stage: {selectedReq.currentStage}
                  </span>
                </div>
            </div>

            <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Narrative / Justification</label>
              <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{selectedReq.requestNarrative || 'No narrative provided.'}"</p>
            </div>

            <div className="mb-8">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Audit Comment <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-gray-200 bg-gray-50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A67C52]/20 text-sm font-medium" 
                rows="3"
                placeholder="Required for the audit trail..." 
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 pb-4">
              <button 
                onClick={() => handleAction(selectedReq._id, 'Approved')} 
                className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
              >
                Confirm Approval
              </button>
              <button 
                onClick={() => handleAction(selectedReq._id, 'Declined')} 
                className="w-full bg-white text-red-600 border border-red-100 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
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
