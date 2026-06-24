import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AttachmentViewer from '../components/AttachmentViewer';
import RequisitionHistory from '../components/RequisitionHistory';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDeptReqs, setAllDeptReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [hodComment, setHodComment] = useState('');

  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const selectedReq = 
    requisitions.find((r) => r._id === selectedReqId) || 
    history.find((r) => r._id === selectedReqId) ||
    allDeptReqs.find((r) => r._id === selectedReqId) || null;

  const syncPortal = async () => {
    if (!token || !user.email) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const [queueRes, historyRes, allRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history/HOD?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);

      const dept = user.department;
      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data.filter(r => r.department === dept) : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data.filter(r => r.department === dept) : []);
      setAllDeptReqs(Array.isArray(allRes.data) ? allRes.data.filter(r => r.department === dept) : []);

      if ('setAppBadge' in navigator) {
        queueRes.data?.length > 0 ? navigator.setAppBadge(queueRes.data.length) : navigator.clearAppBadge();
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
      toast.success("MANAGEMENT ALERTS SYNCED", { icon: '🔔', style: { background: '#000', color: '#A67C52', fontWeight: 'bold' } });
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
    const targetData = activeTab === 'queue' ? filterList(requisitions) : activeTab === 'history' ? filterList(history) : filterList(allDeptReqs);
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
    if (action === 'Declined' && !hodComment) return toast.error("A reason is required to decline.");

    const loadingToast = toast.loading(`${action}ing request...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action, actorRole: 'HOD', actorName: user.name,
        comment: hodComment || (action === 'Approved' ? 'Departmental approval granted.' : '')
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(action === 'Approved' ? 'SENT TO FINANCE' : 'DECLINED', { id: loadingToast });
      setSelectedReqId(null);
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
             <button onClick={handleEnableNotifications} className="hidden md:block bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all">🔔 ENABLE ALERTS</button>
           )}
           <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all">
             <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'HO'}</span>
           </button>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'HO'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Head of Dept'}</h4>
            <p className="text-[9px] font-bold text-[#A67C52] mt-2">HOD STATUS: VERIFIED</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">Sign Out</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none italic">HOD <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              {['queue', 'history', 'all'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === tab ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
                >
                  {tab === 'queue' ? `PENDING (${requisitions.length})` : tab === 'history' ? `HISTORY (${history.length})` : `ALL DEPT (${allDeptReqs.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input type="text" placeholder="SEARCH..." className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={exportData} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-[#A67C52] transition-all shadow-lg">EXPORT CSV</button>
          </div>
        </div>

        <div className="grid gap-4">
          {activeTab === 'queue' && filterList(requisitions).map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xl font-black text-gray-900">{req.requesterName}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase italic">Vendor: {req.vendorName || 'General'}</p>
              </div>
              <button onClick={() => setSelectedReqId(req._id)} className="bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black shadow-lg hover:bg-[#A67C52]">REVIEW</button>
            </div>
          ))}
          {activeTab === 'history' && <RequisitionHistory requisitions={filterList(history)} />}
          {activeTab === 'all' && filterList(allDeptReqs).map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xl font-black text-gray-900">{req.requesterName}</h3>
                <p className="text-[10px] font-bold text-[#A67C52] uppercase italic">Status: {req.status}</p>
              </div>
              <button onClick={() => setSelectedReqId(req._id)} className="text-[10px] font-black underline">VIEW</button>
            </div>
          ))}
        </div>
      </main>

      {selectedReq && ( 
         <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between mb-8">
                  <h3 className="text-2xl font-black italic underline decoration-[#A67C52]">DEPARTMENTAL REVIEW</h3>
                  <button onClick={() => setSelectedReqId(null)} className="font-black text-xl hover:text-[#A67C52]">✕</button>
               </div>
               
               <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
                  <div><p className="text-gray-400 font-bold uppercase">Requester</p><p className="font-black">{selectedReq.requesterName}</p></div>
                  <div><p className="text-gray-400 font-bold uppercase">Amount</p><p className="font-black">{selectedReq.amount} {selectedReq.currency}</p></div>
                  <div className="col-span-2"><p className="text-gray-400 font-bold uppercase">Vendor</p><p className="font-black">{selectedReq.vendorName}</p></div>
               </div>

               {activeTab === 'queue' && (
                 <div className="flex flex-col gap-4 border-t pt-6">
                    <input type="text" placeholder="ADD COMMENT (REQUIRED FOR DECLINE)..." className="border-2 border-gray-100 p-4 rounded-xl text-[10px] font-black" value={hodComment} onChange={(e) => setHodComment(e.target.value)} />
                    <div className="flex gap-4">
                       <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] hover:bg-[#A67C52]">APPROVE</button>
                       <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px]">DECLINE</button>
                    </div>
                 </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default HODDashboard;
