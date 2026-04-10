import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionComment, setActionComment] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  // Normalize Role to Uppercase for consistent checking
  const userRole = user.role ? user.role.toUpperCase() : '';

  useEffect(() => {
    if (userRole) fetchPendingRequests();
  }, [userRole]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      // Passing user.role directly as the backend expects
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/${user.role}?email=${user.email}`, config);
      setRequisitions(res.data);
    } catch (err) {
      toast.error("Failed to sync with Bricks Cloud.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!actionComment.trim()) return toast.error("Comment required for audit.");
    
    const actionToast = toast.loading(`Processing...`);
    // Logic: MD can override if the req is currently at FC stage
    const isOverride = (userRole === 'MD' && selectedReq?.currentStage === 'FC');

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment: actionComment,
        actorRole: user.role,
        actorName: user.name,
        isOverride: isOverride 
      }, config);

      toast.success(`Action recorded.`, { id: actionToast });
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      toast.error("Action failed.", { id: actionToast });
    }
  };

  // --- QUEUE FILTERING LOGIC ---
  // MD sees items at MD stage (Primary) AND items at FC stage (Oversight)
  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  const fcPendingQueue = requisitions.filter(r => r.currentStage === 'FC');

  const renderContent = (data, title, accentColor, buttonLabel, isOverrideView = false) => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accentColor}`}></span> {title}
        </h3>
        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded font-bold">{data.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((req) => (
          <div key={req._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-black text-gray-900 text-sm">{req.requesterName}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{req.department}</p>
              </div>
              <p className="font-black text-[#A67C52] text-sm">{req.currency} {req.amount.toLocaleString()}</p>
            </div>
            <p className="text-xs text-gray-500 mb-6 line-clamp-2">{req.vendorName}</p>
            <button 
              onClick={() => setSelectedReq(req)}
              className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-sm transition-transform active:scale-95 ${isOverrideView ? 'bg-blue-600' : 'bg-[#A67C52]'}`}
            >
              {isOverrideView ? 'Force Review (Override)' : buttonLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            {userRole === 'MD' ? 'Executive Command' : 'Approval Hub'}
          </h1>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-4 py-2 rounded-lg">Logout</button>
        </div>

        {loading ? (
          <p className="text-center py-20 animate-pulse text-[10px] font-black uppercase text-gray-300">Syncing Bricks Cloud...</p>
        ) : (
          <>
            {/* If user is MD, show BOTH queues */}
            {userRole === 'MD' ? (
              <>
                {renderContent(mdPrimaryQueue, "Items Awaiting Your Signature", "bg-green-500", "Approve Now")}
                {fcPendingQueue.length > 0 && renderContent(fcPendingQueue, "FC Oversight Log (Live)", "bg-blue-600", "Override FC", true)}
              </>
            ) : (
              // Everyone else (HOD, Accountant, FC) sees the standard queue
              renderContent(requisitions, "Pending Approvals", "bg-[#A67C52]", "Process Request")
            )}

            {requisitions.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-[2rem]">
                <p className="text-[10px] font-black text-gray-300 uppercase">System Clear • No Pending Requests</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* ... (Keep your Action Modal from previous version) ... */}
    </div>
  );
};

export default Dashboard;
