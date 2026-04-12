import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MDDashboard = () => {
  const [inbox, setInbox] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [mdComment, setMdComment] = useState('');
  
  // New State for Profile and Notifications
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    if (!token) {
      toast.error("Session expired. Please login again.");
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const [mdRes, fcRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/MD`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_BASE_URL}/requisitions/pending/FC`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_BASE_URL}/requisitions/history/MD`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }).catch(() => ({ data: [] }))
      ]);

      setInbox(Array.isArray(mdRes.data) ? mdRes.data : []);
      setBacklog(Array.isArray(fcRes.data) ? fcRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);

      // Update Native App Badge if supported
      if ('setAppBadge' in navigator) {
        const total = (mdRes.data?.length || 0) + (fcRes.data?.length || 0);
        total > 0 ? navigator.setAppBadge(total) : navigator.clearAppBadge();
      }

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      toast.error("Syncing failed. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  // NATIVE NOTIFICATION ENABLED LOGIC
  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("EXECUTIVE ALERTS ACTIVE", {
        icon: '🔔',
        style: { background: '#000', color: '#A67C52', fontWeight: 'bold' }
      });
      
      // Test Notification
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification("BRICKS PORTAL", {
          body: "System alerts successfully synchronized.",
          icon: '/logo192.png'
        });
      });
    } else {
      toast.error("Alerts were blocked.");
    }
  };

  const filterList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(req => 
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const exportToExcel = () => {
    const dataToExport = activeTab === 'pending' ? [...inbox, ...backlog] : history;
    if (dataToExport.length === 0) return toast.error("No data to export");
    const headers = "Date,Department,Staff,Amount,Currency,Vendor,Status\n";
    const csv = dataToExport.map(r => `${new Date(r.createdAt).toLocaleDateString()},${r.department},${r.requesterName},${r.amount},${r.currency},${r.vendorName || 'N/A'},${r.status}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MD_Log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAction = async (id, action, isOverride = false) => {
    if (!mdComment && action === 'Declined') return toast.error("Reason required to decline.");
    const loadingToast = toast.loading('Synchronizing decision...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'MD',
        actorName: 'Emmanuel Maiguwa',
        comment: mdComment || (action === 'Approved' ? 'Final approval granted.' : ''),
        isOverride
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(action === 'Approved' ? "AUTHORIZED" : "DECLINED", { id: loadingToast });
      setSelectedReq(null);
      setMdComment('');
      fetchData();
    } catch (err) {
      toast.error("Processing failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-4 border-[#A67C52] border-t-transparent rounded-full mb-4"></div>
      <p className="text-[10px] font-black tracking-widest text-[#A67C52] uppercase">Syncing Executive Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB] uppercase">
      {/* CORPORATE NAV */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Executive</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase italic">Digital Maritime Solutions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Native Notification Trigger */}
          {!notificationsEnabled && (
             <button 
              onClick={handleEnableNotifications}
              className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all"
             >
               🔔 ENABLE ALERTS
             </button>
          )}

          {/* Profile Toggle Button */}
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center overflow-hidden hover:scale-105 transition-all active:scale-95"
          >
             <span className="text-[10px] font-black">EM</span>
          </button>
        </div>
      </nav>

      {/* --- EXECUTIVE PROFILE DROPDOWN --- */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] mx-auto mb-3 flex items-center justify-center text-2xl font-black text-[#A67C52]">EM</div>
            <h4 className="text-sm font-black text-gray-900">Emmanuel Maiguwa</h4>
            <p className="text-[9px] font-bold text-[#A67C52]">Managing Director</p>
          </div>
          
          <div className="space-y-2 border-t border-gray-50 pt-4">
            <button 
              onClick={handleEnableNotifications}
              className={`w-full text-left px-4 py-3 rounded-xl text-[9px] font-black flex justify-between items-center ${notificationsEnabled ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}
            >
              PUSH NOTIFICATIONS <span>{notificationsEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button 
              onClick={() => { localStorage.clear(); navigate('/'); }}
              className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              TERMINATE SESSION
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">MD <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-4">
              <button onClick={() => setActiveTab('pending')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'pending' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>CURRENT QUEUE</button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>APPROVAL HISTORY</button>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH RECORDS..." 
              className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:border-[#A67C52] shadow-sm flex-1 md:w-64" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button onClick={exportToExcel} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all shadow-lg">EXPORT</button>
          </div>
        </div>

        {activeTab === 'pending' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLUMN 1: PENDING MD APPROVAL */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                <h3 className="text-[10px] font-black text-[#A67C52] tracking-[0.3em]">Pending MD Approval</h3>
                <span className="bg-[#A67C52] text-white text-[8px] font-black px-2 py-0.5 rounded-full">{inbox.length}</span>
              </div>
              {filterList(inbox).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all active:scale-[0.98]">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 mb-1">{req.department}</p>
                    <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                    <p className="text-lg font-black text-[#A67C52] leading-none mt-1">{req.currency} {req.amount?.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedReq(req)} 
                    className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all shadow-lg"
                  >
                    PROCESS
                  </button>
                </div>
              ))}
              {inbox.length === 0 && <p className="text-center py-10 text-gray-300 text-[10px] font-black italic underline decoration-[#A67C52]">No requests awaiting authorization</p>}
            </section>

            {/* COLUMN 2: FC OVERSIGHT */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                <h3 className="text-[10px] font-black text-red-500 tracking-[0.3em]">FC Oversight (Override)</h3>
                <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{backlog.length}</span>
              </div>
              {filterList(backlog).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border-l-4 border-l-red-500 border-gray-100 shadow-sm flex justify-between items-center opacity-80 hover:opacity-100 transition-all">
                  <div>
                    <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                    <p className="text-[9px] font-bold text-red-500 italic mt-1 uppercase">Pending Finance Clearance</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedReq({ ...req, isOverride: true }) }} 
                    className="bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    OVERRIDE
                  </button>
                </div>
              ))}
              {backlog.length === 0 && <p className="text-center py-10 text-gray-300 text-[10px] font-black italic">Finance queue clear</p>}
            </section>
          </div>
        ) : (
          /* HISTORY TABLE */
          <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest">DATE</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest">DETAILS</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(history).map(req => (
                    <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 text-[10px] font-bold text-gray-500">{new Date(req.updatedAt).toLocaleDateString()}</td>
                      <td className="p-6">
                        <p className="text-[10px] font-black text-gray-800 uppercase">{req.requesterName}</p>
                        <p className="text-[11px] font-black text-[#A67C52]">{req.currency} {req.amount?.toLocaleString()}</p>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-full inline-block ${req.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {req.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && <div className="text-center py-20 text-gray-300 text-[10px] font-black tracking-widest">NO HISTORY RECORDS FOUND</div>}
            </div>
          </div>
        )}
      </main>

      {/* --- EXECUTIVE ACTION MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">
                    {selectedReq.isOverride ? 'Executive Override' : 'Authorization Review'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase">Dept: {selectedReq.department} | ID: {selectedReq._id.slice(-6)}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              <div className="space-y-6 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Amount Authorized</p>
                    <p className="text-2xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Requested By</p>
                    <p className="text-xs font-black text-gray-800">{selectedReq.requesterName}</p>
                  </div>
                </div>

                <div className="bg-[#FBF9F6] p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-300 mb-2 uppercase tracking-widest">Requisition Purpose</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>

                {selectedReq.attachment && (
                  <a href={selectedReq.attachment} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-4 bg-gray-900 text-[#A67C52] w-full py-5 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl">
                    📎 VIEW SUPPORTING DOCUMENTATION
                  </a>
                )}
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest italic">Executive Comments (Disbursement Instructions)</p>
                <textarea 
                  value={mdComment} 
                  onChange={(e) => setMdComment(e.target.value)} 
                  placeholder={selectedReq.isOverride ? "Reason for Finance override..." : "Final instructions for Account dept..."}
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2.5rem] p-6 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved', selectedReq.isOverride)} 
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl shadow-[#A67C52]/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    AUTHORIZE PAYMENT
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined', selectedReq.isOverride)} 
                    className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all active:scale-95"
                  >
                    DECLINE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MDDashboard;
