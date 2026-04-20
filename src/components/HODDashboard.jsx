import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AttachmentViewer from '../components/AttachmentViewer';
import RequisitionHistory from '../components/RequisitionHistory';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); 
  const [selectedReq, setSelectedReq] = useState(null); 
  const [hodComment, setHodComment] = useState('');

  // NATIVE PWA STATES
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const syncPortal = async () => {
    if (!token || !user.email) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const [queueRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history/HOD?email=${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      const queueData = Array.isArray(queueRes.data) ? queueRes.data : [];
      setRequisitions(queueData);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);

      if ('setAppBadge' in navigator) {
        queueData.length > 0 ? navigator.setAppBadge(queueData.length) : navigator.clearAppBadge();
      }

    } catch (err) {
      console.error("Portal Sync Error:", err);
      toast.error("Global portal sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncPortal();
  }, [user.email, API_BASE_URL, token]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Notifications not supported");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("MANAGEMENT ALERTS SYNCED", {
        icon: '🔔',
        style: { background: '#000', color: '#A67C52', fontWeight: 'bold' }
      });
    }
  };

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id.includes(searchTerm)
    );
  };

  const exportData = () => {
    const targetData = activeTab === 'queue' ? filterList(requisitions) : filterList(history);
    if (targetData.length === 0) return toast.error("Nothing to export");

    const headers = "ID,Date,Due Date,Staff,Amount,Currency,Vendor,Status\n";
    const csvContent = targetData.map(r => 
      `${r._id},${new Date(r.createdAt).toLocaleDateString()},${new Date(r.dueDate).toLocaleDateString()},${r.requesterName},${r.amount},${r.currency},${r.vendorName || 'N/A'},${r.status}`
    ).join("\n");

    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bricks_HOD_${activeTab}_Report.csv`;
    link.click();
  };

  const handleAction = async (id, action) => {
    if (action === 'Declined' && !hodComment) {
      return toast.error("A reason is required to decline.");
    }

    const loadingToast = toast.loading(`${action}ing request...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'HOD',
        actorName: user.name,
        comment: hodComment || (action === 'Approved' ? 'Departmental approval granted.' : '')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(action === 'Approved' ? 'SENT TO FINANCE' : 'DECLINED', { id: loadingToast });
      setSelectedReq(null);
      setHodComment('');
      syncPortal(); 
    } catch (err) {
      toast.error("Action could not be processed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#A67C52] mb-4"></div>
      <p className="font-black text-[#A67C52] text-[10px] tracking-widest uppercase">Syncing Management Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black text-xs">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Management</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">HOD DASHBOARD</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {!notificationsEnabled && (
             <button onClick={handleEnableNotifications} className="hidden md:block bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all">
               🔔 ENABLE ALERTS
             </button>
           )}
           <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all">
             <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'HO'}</span>
           </button>
        </div>
      </nav>

      {/* PROFILE DROPDOWN */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'HO'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Head of Dept'}</h4>
            <p className="text-[9px] font-bold text-[#A67C52] mt-2">HOD STATUS: VERIFIED</p>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-50">
             <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
               TERMINATE SESSION
             </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none italic">HOD <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button 
                onClick={() => setActiveTab('queue')}
                className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'queue' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
              >
                PENDING APPROVAL ({requisitions.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
              >
                ACTION HISTORY ({history.length})
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH STAFF OR VENDOR..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={exportData} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-[#A67C52] transition-all shadow-lg">
              EXPORT CSV
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {activeTab === 'queue' ? (
            <>
              {filterList(requisitions).map(req => (
                <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50">
                      <span className="text-[8px] font-black text-[#A67C52]">{req.currency}</span>
                      <span className="text-sm font-black text-gray-800">{req.amount?.toLocaleString()}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{req.requesterName}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase italic">Vendor: {req.vendorName || 'General'}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedReq(req)} className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-lg hover:bg-[#A67C52] transition-all">
                    REVIEW REQUEST
                  </button>
                </div>
              ))}
              {filterList(requisitions).length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
                  <p className="text-gray-300 font-black tracking-[0.4em] text-xs uppercase underline decoration-[#A67C52] decoration-2 underline-offset-8">No records currently pending</p>
                </div>
              )}
            </>
          ) : (
            <RequisitionHistory 
              requisitions={filterList(history).filter(req => req.dept === user.dept || req.department === user.dept)} 
            />
          )}
        </div>
      </main>

      {/* --- PROCESS MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic uppercase underline decoration-[#A67C52] decoration-4 underline-offset-4">Departmental Review</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-2 tracking-widest uppercase">ID: #{selectedReq._id.slice(-6)}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">✕</button>
              </div>

              {/* INFO GRID - UPDATED TO 5 COLUMNS FOR ACCOUNT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Requester</p>
                  <p className="text-xs font-black text-gray-800 truncate">{selectedReq.requesterName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Value</p>
                  <p className="text-xs font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Due Date</p>
                  <p className="text-xs font-black text-red-500">{new Date(selectedReq.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Mode</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.modeOfPayment || 'N/A'}</p>
                </div>
                {/* --- NEW FIELD: ACCOUNT DETAILS --- */}
                <div className="bg-gray-900 p-4 rounded-2xl border border-[#A67C52]/30">
                  <p className="text-[9px] font-black text-[#A67C52] mb-1 uppercase tracking-widest">Account Details</p>
                  <p className="text-[10px] font-bold text-white break-words leading-tight">
                    {selectedReq.accountDetails || 'NOT PROVIDED'}
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="bg-[#FBF9F6] p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-300 mb-2 uppercase italic tracking-widest">Description of Need</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>
                
                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-2 bg-gray-50 overflow-hidden">
                  <p className="text-[9px] font-black text-gray-400 mb-2 mt-4 ml-6 uppercase tracking-widest">Supporting Documentation Preview</p>
                  <div className="w-full bg-white rounded-[2rem] p-4 min-h-[300px]">
                    <AttachmentViewer url={selectedReq.attachmentUrl} />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">HOD Review Remarks</p>
                <textarea 
                  value={hodComment}
                  onChange={(e) => setHodComment(e.target.value)}
                  placeholder="Provide instructions for Finance or reasons for decline..."
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2.5rem] p-6 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl shadow-[#A67C52]/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    APPROVE TO FINANCE
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined')}
                    className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all active:scale-95"
                  >
                    DECLINE REQUEST
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

export default HODDashboard;
