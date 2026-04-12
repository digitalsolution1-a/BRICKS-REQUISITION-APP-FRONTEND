import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // NATIVE PWA & UI STATES
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAccountsQueue = async () => {
    try {
      setLoading(true);
      if (!user.email) {
        navigate('/');
        return;
      }

      // Fetches requisitions specifically at the 'ACCOUNTANT' stage
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = Array.isArray(res.data) ? res.data : [];
      setRequisitions(data);

      // UPDATE NATIVE APP BADGE
      if ('setAppBadge' in navigator) {
        data.length > 0 ? navigator.setAppBadge(data.length) : navigator.clearAppBadge();
      }

    } catch (err) {
      console.error("Treasury Sync Error:", err);
      toast.error("Failed to sync treasury data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsQueue();
  }, [user.email, API_BASE_URL, token]);

  // NATIVE NOTIFICATION TRIGGER
  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Browser not supported");
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("TREASURY ALERTS ACTIVE", {
        icon: '💰',
        style: { background: '#000', color: '#A67C52', fontWeight: 'bold' }
      });
    }
  };

  const filteredRequests = requisitions.filter(req => 
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req._id.includes(searchTerm)
  );

  const exportToCSV = () => {
    const headers = "ID,Date,Requester,Vendor,Amount,Currency,MD_Notes\n";
    const rows = filteredRequests.map(r => {
      const mdApproval = r.approvalHistory?.find(h => h.role === 'MD');
      return `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.vendorName || 'N/A'},${r.amount},${r.currency},"${mdApproval?.comment || ''}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_Treasury_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePaymentComplete = async (id) => {
    const confirmPayment = window.confirm("Confirm this requisition has been paid/disbursed?");
    if (!confirmPayment) return;

    const loadingToast = toast.loading('Recording Disbursement...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: 'Approved', 
        actorRole: 'ACCOUNTANT',
        actorName: user.name || 'Accounts Dept',
        comment: 'Disbursement Completed - Funds Released'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("TREASURY RECORD UPDATED", { id: loadingToast });
      fetchAccountsQueue();
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
      <div className="animate-spin h-10 w-10 border-t-4 border-[#A67C52] border-solid rounded-full mb-4"></div>
      <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">Syncing Treasury Ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F9] uppercase">
      {/* NATIVE-STYLE NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-xl flex items-center justify-center font-black text-xl italic text-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Treasury</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Accounts Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!notificationsEnabled && (
            <button 
              onClick={handleEnableNotifications}
              className="hidden md:block bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all"
            >
              🔔 ENABLE ALERTS
            </button>
          )}
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all"
          >
            <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</span>
          </button>
        </div>
      </nav>

      {/* EXECUTIVE PROFILE DROPDOWN */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'AC'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Accountant'}</h4>
            <p className="text-[9px] font-bold text-green-500 mt-2 tracking-widest">TREASURY ACCESS: ACTIVE</p>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-50">
             <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-center px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
               End Session
             </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER & TOOLS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">Accounts <span className="text-[#A67C52]">Ledger</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3 underline decoration-[#A67C52] decoration-2 underline-offset-4">Disbursement Queue ({requisitions.length})</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH VENDOR OR REF..."
              className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={exportToCSV}
              className="bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A67C52] transition-all shadow-lg flex items-center gap-2"
            >
              📥 EXPORT
            </button>
          </div>
        </div>

        {/* REQUISITION LIST */}
        <div className="space-y-6">
          {filteredRequests.map(req => {
            const mdApproval = req.approvalHistory?.find(h => h.role === 'MD');
            const hodApproval = req.approvalHistory?.find(h => h.role === 'HOD');
            
            return (
              <div key={req._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all active:scale-[0.99]">
                <div className="p-8 flex flex-col md:flex-row justify-between gap-8">
                  {/* Left: Requester Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-green-100 text-green-600 text-[8px] font-black px-3 py-1 rounded-full tracking-widest">APPROVED BY MD</span>
                      <span className="text-gray-300 font-bold text-[9px] tracking-widest">ID: #{req._id.slice(-6)}</span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{req.vendorName || "General Requisition"}</h2>
                    <div className="flex gap-4 mt-2 mb-6">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Staff: <span className="text-black">{req.requesterName}</span></p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Dept: <span className="text-[#A67C52]">{hodApproval?.actorName || 'Verified'}</span></p>
                    </div>
                    
                    {/* DISBURSEMENT INSTRUCTIONS */}
                    <div className="bg-[#FBF9F6] p-6 rounded-[2rem] border-2 border-dashed border-gray-100">
                      <p className="text-[9px] font-black text-[#A67C52] uppercase tracking-[0.2em] mb-2 italic">Executive Instructions:</p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                        "{mdApproval?.comment || "Standard disbursement approved."}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-between items-end md:w-72 bg-gray-50 p-8 rounded-[2rem]">
                    <div className="text-right w-full">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Payable Amount</p>
                      <p className="text-3xl font-black text-gray-900 leading-none tracking-tighter">{req.currency} {req.amount.toLocaleString()}</p>
                    </div>
                    
                    <div className="w-full space-y-3 mt-8">
                      {req.attachment && (
                        <a 
                          href={req.attachment} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center w-full py-3 bg-white border border-gray-200 rounded-xl text-[9px] font-black hover:bg-gray-100 transition-all tracking-widest"
                        >
                          📎 VIEW INVOICE
                        </a>
                      )}
                      <button 
                        onClick={() => handlePaymentComplete(req._id)}
                        className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#A67C52] transition-all shadow-xl shadow-black/10 active:scale-95"
                      >
                        CONFIRM DISBURSEMENT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="py-32 text-center bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏦</span>
              </div>
              <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs underline decoration-[#A67C52] decoration-2 underline-offset-8">Treasury Queue Clear</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountantDashboard;
