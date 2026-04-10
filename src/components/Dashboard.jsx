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
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff' };
  // Ensure we compare roles in uppercase to avoid logic slips
  const userRole = user.role ? user.role.toUpperCase() : 'STAFF';

  useEffect(() => {
    fetchPendingRequests();
  }, [userRole]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      
      // Specialist Note: Ensure your backend endpoint for MD returns both 'MD' AND 'FC' stages
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/${user.role}?email=${user.email}`, config);
      setRequisitions(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to sync with Bricks Cloud.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!actionComment.trim()) return toast.error("An audit comment is required.");
    
    const loadingToast = toast.loading(`Recording ${action.toLowerCase()}...`);
    
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

      toast.success(`Requisition ${action.toLowerCase()} successfully.`, { id: loadingToast });
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed", { id: loadingToast });
    }
  };

  // --- OVERSIGHT LOGIC ---
  // MD Primary: Items currently waiting for MD signature
  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  // FC Oversight: Items currently waiting for FC (that MD can override)
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
                  <button 
                    onClick={() => setSelectedReq(req)} 
                    className={`text-[10px] font-black px-7 py-3 rounded-xl uppercase tracking-widest text-white shadow-md active:scale-95 transition-all ${isOverrideView ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#A67C52] hover:bg-black'}`}
                  >
                    {isOverrideView ? 'Override FC' : buttonLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {data.map((req) => (
           <div key={req._id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="font-black text-gray-900 text-sm">{req.requesterName}</p>
                 <p className="text-[9px] text-gray-400 font-bold uppercase">{req.department}</p>
               </div>
               <p className="font-black text-[#A67C52]">{req.currency} {req.amount.toLocaleString()}</p>
             </div>
             <button 
               onClick={() => setSelectedReq(req)}
               className={`w-full py-4 rounded-xl text-[10px] font-black uppercase text-white ${isOverrideView ? 'bg-blue-600' : 'bg-[#A67C52]'}`}
             >
               {isOverrideView ? 'Override FC' : buttonLabel}
             </button>
           </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 lg:p-12 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10 lg:mb-16">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 uppercase tracking-tighter">
              {userRole === 'MD' ? 'Executive Command' : 'Approval Hub'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Bricks Mursten Mattoni Ltd.</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black text-red-500 uppercase">Logout</button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] font-black text-gray-300 uppercase animate-pulse">Syncing...</div>
        ) : (
          <>
            {userRole === 'MD' ? (
              <>
                {/* Section 1: MD's own approval queue */}
                {renderContent(mdPrimaryQueue, "Items Pending Your Approval", "bg-green-500", "Review & Sign")}
                
                {/* Section 2: Oversight/Override queue (FC Stage) */}
                {fcPendingQueue.length > 0 && (
                  renderContent(fcPendingQueue, "FC Oversight Log", "bg-blue-600", "Review Override", true)
                )}
              </>
            ) : (
              renderContent(requisitions, "Requisition Queue", "bg-[#A67C52]", "Process Request")
            )}
            
            {requisitions.length === 0 && (
              <div className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-300 font-black uppercase text-[10px]">Queue Clear</div>
            )}
          </>
        )}
      </div>

      {/* ACTION MODAL (Ensure this is correctly placed) */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-12 relative animate-slide-up shadow-2xl">
            <button onClick={() => setSelectedReq(null)} className="absolute top-6 right-8 font-bold">✕</button>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-4">{selectedReq.vendorName}</h2>
            <p className="text-xl font-black text-[#A67C52] mb-8">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
            
            <textarea 
              className="w-full border border-gray-200 bg-gray-50 p-4 rounded-xl mb-6 text-sm" 
              rows="3" 
              placeholder="Audit comment required..." 
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
            />

            <div className="flex gap-4">
              <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Confirm Approval</button>
              <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-red-50 text-red-600 py-4 rounded-xl font-black uppercase text-[10px]">Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
