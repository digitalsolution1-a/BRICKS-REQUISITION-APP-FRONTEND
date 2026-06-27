import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RequisitionHistory from '../components/RequisitionHistory';

const MDDashboard = () => {
  const [inbox, setInbox] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [mdComment, setMdComment] = useState('');
  
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getFCComment = (historyArray) => {
    if (!historyArray || !Array.isArray(historyArray)) return null;
    const fcEntry = [...historyArray].reverse().find(entry => entry.actorRole === 'FC');
    return fcEntry ? fcEntry.comment : null;
  };

  const fetchData = async () => {
    if (!token) return navigate('/');

    try {
      setLoading(true);
      const [mdRes, fcRes, historyRes, allDeptsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/MD`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_BASE_URL}/requisitions/pending/FC`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/history`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }).catch(() => ({ data: [] }))
      ]);

      setInbox(Array.isArray(mdRes.data) ? mdRes.data : []);
      setBacklog(Array.isArray(fcRes.data) ? fcRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setAllDepartments(Array.isArray(allDeptsRes.data) ? allDeptsRes.data : []);

      if ('setAppBadge' in navigator) {
        const total = (mdRes.data?.length || 0) + (fcRes.data?.length || 0);
        total > 0 ? navigator.setAppBadge(total) : navigator.clearAppBadge();
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      toast.error("Executive portal sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Notifications not supported");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("EXECUTIVE ALERTS ACTIVE", {
        icon: '🔔',
        style: { background: '#000', color: '#A67C52', fontWeight: 'bold' }
      });
    }
  };

  const filterList = (list) => {
    if (!Array.isArray(list)) return [];
    const term = searchTerm.toLowerCase();
    return list.filter(req => 
      req.requesterName?.toLowerCase().includes(term) ||
      req.vendorName?.toLowerCase().includes(term) ||
      req.department?.toLowerCase().includes(term) ||
      (req._id && req._id.includes(term))
    );
  };

  const exportData = () => {
    let dataToExport = activeTab === 'pending' ? [...inbox, ...backlog] : activeTab === 'history' ? history : allDepartments;
    if (dataToExport.length === 0) return toast.error("No data to export");
    const headers = "Date,Department,Staff,Amount,Currency,Vendor,Status\n";
    const csv = dataToExport.map(r => `${new Date(r.createdAt).toLocaleDateString()},${r.department},${r.requesterName},${r.amount},${r.currency},${r.vendorName || 'N/A'},${r.status}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_MD_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAction = async (id, action, isOverride = false) => {
    if (!mdComment && action === 'Declined') return toast.error("Reason required to decline.");
    
    // If archiving, we don't want to change status, just add a note if possible
    const isArchive = selectedReq?.isArchiveView;
    const loadingToast = toast.loading('Syncing executive decision...');
    
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: isArchive ? 'Note' : action,
        actorRole: 'MD',
        actorName: user.name || 'MD Office',
        comment: mdComment || (action === 'Approved' ? 'Final authorization granted.' : ''),
        isOverride
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(isArchive ? "NOTE SAVED" : (action === 'Approved' ? "AUTHORIZED" : "DECLINED"), { id: loadingToast });
      
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
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Executive</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase italic">Managing Director Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!notificationsEnabled && (
             <button onClick={handleEnableNotifications} className="hidden md:flex bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all">
               🔔 ENABLE ALERTS
             </button>
          )}
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all">
             <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'EM'}</span>
          </button>
        </div>
      </nav>

      {/* PROFILE DROPDOWN */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] mx-auto mb-3 flex items-center justify-center text-2xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'EM'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user.name || 'Emmanuel Maiguwa'}</h4>
            <p className="text-[9px] font-bold text-[#A67C52] mt-2 tracking-widest">MANAGING DIRECTOR</p>
          </div>
          <div className="space-y-2 border-t border-gray-50 pt-4">
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
              SIGN OUT
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic leading-none">MD <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button onClick={() => setActiveTab('pending')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'pending' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>PENDING APPROVAL</button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>APPROVAL HISTORY</button>
              <button onClick={() => setActiveTab('all')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'all' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>ALL DEPARTMENTS ({allDepartments.length})</button>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH RECORDS..." 
              className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:border-[#A67C52] shadow-sm flex-1 md:w-64" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button onClick={exportData} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all shadow-lg">EXPORT CSV</button>
          </div>
        </div>

        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                <h3 className="text-[10px] font-black text-[#A67C52] tracking-[0.3em]">Direct Authorization</h3>
                <span className="bg-[#A67C52] text-white text-[8px] font-black px-2 py-0.5 rounded-full">{inbox.length}</span>
              </div>
              {filterList(inbox).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all animate-in slide-in-from-left-2">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 mb-1">{req.department}</p>
                    <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                    <p className="text-lg font-black text-[#A67C52] leading-none mt-1">{req.currency} {req.amount?.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">PROCESS</button>
                </div>
              ))}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                <h3 className="text-[10px] font-black text-red-500 tracking-[0.3em]">FC Oversight (Override)</h3>
                <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{backlog.length}</span>
              </div>
              {filterList(backlog).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border-l-4 border-l-red-500 border-gray-100 shadow-sm flex justify-between items-center opacity-80 hover:opacity-100 transition-all">
                  <div>
                    <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                    <p className="text-[9px] font-bold text-red-500 italic mt-1 uppercase">Awaiting Finance Clearance</p>
                  </div>
                  <button onClick={() => { setSelectedReq({ ...req, isOverride: true }) }} className="bg-red-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black transition-all">OVERRIDE</button>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'history' && <RequisitionHistory requisitions={filterList(history)} />}

        {activeTab === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterList(allDepartments).map(req => (
              <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-100 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">STAGE: {req.currentStage}</span>
                  </div>
                  <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                  <p className="text-base font-black text-[#A67C52] leading-none mt-1">{req.currency} {req.amount?.toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedReq({ ...req, isArchiveView: true })} className="bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">VIEW</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">
                    {selectedReq.isArchiveView ? 'REQUEST RECORD' : 'Authorization'}
                  </h3>
                </div>
                <button onClick={() => { setSelectedReq(null); setMdComment(''); }} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>
              
              <div className="bg-[#FBF9F6] p-6 rounded-[2rem] border border-gray-100 mb-6">
                <p className="text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest">Narrative</p>
                <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">"{selectedReq.requestNarrative}"</p>
              </div>

              <textarea 
                value={mdComment} 
                onChange={(e) => setMdComment(e.target.value)} 
                placeholder="Enter remarks..."
                className="w-full h-24 bg-gray-50 border-2 rounded-[2rem] p-6 text-xs font-bold outline-none focus:border-[#A67C52] mb-6"
              />
              
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => handleAction(selectedReq._id, 'Approved', selectedReq.isOverride)} 
                  className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:scale-[1.02] transition-all"
                >
                  {selectedReq.isArchiveView ? 'SAVE NOTE' : 'AUTHORIZE'}
                </button>
                {!selectedReq.isArchiveView && (
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined', selectedReq.isOverride)} 
                    className="flex-1 bg-white border-2 border-red-100 text-red-500 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all"
                  >
                    DECLINE
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MDDashboard;
