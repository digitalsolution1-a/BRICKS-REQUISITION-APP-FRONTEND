import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MDDashboard = () => {
  const [inbox, setInbox] = useState([]); // MD stage
  const [backlog, setBacklog] = useState([]); // FC stage
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/requisitions/pending/MD`);
      setInbox(response.data.filter(item => item.currentStage === 'MD'));
      setBacklog(response.data.filter(item => item.currentStage === 'FC'));
    } catch (err) {
      toast.error("Failed to sync maritime data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action, isOverride = false) => {
    const promptMsg = isOverride ? "Reason for MD Override (Bypassing FC):" : "Approval Comments:";
    const comment = prompt(promptMsg);
    
    if (comment === null) return;

    const loadingToast = toast.loading(isOverride ? 'Bypassing FC Control...' : 'Processing Approval...');

    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: action,
        comment: comment,
        actorRole: 'MD',
        actorName: 'Emmanuel Maiguwa', 
        isOverride: isOverride
      });
      
      toast.success(isOverride ? "FC Bypassed: Moved to Accounts" : "Requisition Approved", { id: loadingToast });
      fetchRequests();
    } catch (err) {
      toast.error("Action failed. Check network.", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-[#A67C52] rounded-full mb-4"></div>
        <p className="text-[#A67C52] font-black uppercase tracking-widest text-xs">Syncing Bricks Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-tight">
            MD Control Center
          </h1>
          <p className="text-[#A67C52] text-[10px] font-black uppercase tracking-[0.3em]">
            Executive Oversight & Override Terminal
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Live: {inbox.length + backlog.length} Pending</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMN 1: STANDARD INBOX */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#A67C52] pb-3">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Standard Inbox</h2>
            <span className="bg-[#A67C52] text-white text-[10px] px-2 py-1 rounded-md font-bold">{inbox.length}</span>
          </div>

          {inbox.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold text-sm italic">All MD-stage approvals are completed.</p>
            </div>
          ) : inbox.map(req => (
            <div key={req._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-800 leading-tight">{req.vendorName}</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Ref: {req._id.slice(-8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#A67C52]">{req.currency} {req.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{req.requesterName}</p>
                </div>
              </div>
              <button 
                onClick={() => handleAction(req._id, 'Approved', false)}
                className="w-full bg-[#A67C52] hover:bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                Approve to Accounts
              </button>
            </div>
          ))}
        </div>

        {/* COLUMN 2: FC OVERRIDE CONTROL */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-red-500 pb-3">
            <h2 className="text-sm font-black text-red-600 uppercase tracking-widest">FC Backlog / Override</h2>
            <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-bold">{backlog.length}</span>
          </div>

          {backlog.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold text-sm italic">No items currently stuck at FC stage.</p>
            </div>
          ) : backlog.map(req => (
            <div key={req._id} className="bg-white rounded-2xl shadow-sm border-l-4 border-l-red-500 border-gray-100 p-6 opacity-90 hover:opacity-100 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-800 leading-tight">{req.vendorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter border border-red-100">Delayed at FC</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-gray-800">{req.currency} {req.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{req.requesterName}</p>
                </div>
              </div>
              <button 
                onClick={() => handleAction(req._id, 'Approved', true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md"
              >
                Force Approve (Bypass FC)
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MDDashboard;
