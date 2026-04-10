import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const MDDashboard = () => {
  const [inbox, setInbox] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // UPDATED: Parallel fetching to populate both MD and FC queues
  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // We call both endpoints simultaneously
      const [mdRes, fcRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/MD`),
        axios.get(`${API_BASE_URL}/requisitions/pending/FC`)
      ]);

      // Inbox: Directly at MD stage
      setInbox(mdRes.data);
      
      // Backlog: Sitting at FC stage (Available for Oversight/Override)
      setBacklog(fcRes.data);
      
    } catch (err) {
      toast.error("Failed to sync maritime data.");
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate('/');
  };

  const handleAction = async (id, action, isOverride = false) => {
    const promptMsg = isOverride 
      ? "Reason for MD Override (Bypassing FC):" 
      : "Payment Instructions for Accountant:";
    
    const comment = prompt(promptMsg);
    if (comment === null) return; // User cancelled

    const loadingToast = toast.loading(isOverride ? 'Executing Override...' : 'Processing...');

    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: action,
        comment: comment,
        actorRole: 'MD',
        actorName: 'Emmanuel Maiguwa', 
        isOverride: isOverride
      });

      toast.success(isOverride ? "FC Bypassed & Synchronized" : "Action Synchronized", { id: loadingToast });
      fetchRequests(); // Refresh both columns
    } catch (err) {
      toast.error("Process failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-[#A67C52] border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      {/* --- CORPORATE NAV BAR --- */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-gray-900 uppercase">Bricks</span>
              <span className="text-[8px] font-bold text-[#A67C52] tracking-[0.2em] -mt-1 uppercase">Portal</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/profile" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#A67C52] transition-colors">
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">MD Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Maritime Oversight</p>
          </div>
        </div>

        {/* Responsive Grid: 1 column on mobile, 2 on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: MD INBOX */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-[#A67C52] pb-2">
              <span className="bg-[#A67C52] text-white text-[10px] font-bold px-2 py-0.5 rounded">INBOX</span>
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Awaiting MD Approval</h2>
            </div>

            {inbox.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-gray-300 text-xs font-bold italic uppercase tracking-widest">No pending items in queue.</div>
            ) : inbox.map(req => (
              <div key={req._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-gray-800 uppercase text-sm">{req.vendorName || req.requesterName}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Request Ref: {req._id.slice(-6)}</p>
                  </div>
                  <span className="text-[#A67C52] font-black text-sm">{req.currency} {req.amount.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleAction(req._id, 'Approved', false)}
                  className="w-full bg-[#A67C52] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Approve to Accounts
                </button>
              </div>
            ))}
          </section>

          {/* COLUMN 2: OVERRIDE CONTROL */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-red-500 pb-2">
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">OVERRIDE</span>
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Finance Controller Oversight</h2>
            </div>

            {backlog.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-gray-300 text-xs font-bold italic uppercase tracking-widest">FC Backlog is clear.</div>
            ) : backlog.map(req => (
              <div key={req._id} className="bg-white p-5 rounded-2xl border-l-4 border-l-red-500 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-gray-800 uppercase text-sm">{req.vendorName || req.requesterName}</h3>
                    <p className="text-[9px] text-red-500 font-bold uppercase mt-1">Pending FC Verification</p>
                  </div>
                  <span className="text-gray-900 font-black text-sm">{req.currency} {req.amount.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleAction(req._id, 'Approved', true)}
                  className="w-full bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Force Approve (Bypass FC)
                </button>
              </div>
            ))}
          </section>

        </div>
      </main>
    </div>
  );
};

export default MDDashboard;
