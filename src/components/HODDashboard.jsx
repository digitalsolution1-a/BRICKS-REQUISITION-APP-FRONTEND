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

  const selectedReq = requisitions.find((r) => r._id === selectedReqId) || null;

  const syncPortal = async () => {
    if (!token || !user.email) {
      navigate('/');
      return;
    }
    try {
      setLoading(true);
      const [queueRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history/HOD?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      if ('setAppBadge' in navigator) {
        queueRes.data?.length > 0 ? navigator.setAppBadge(queueRes.data.length) : navigator.clearAppBadge();
      }
    } catch (err) {
      toast.error("Global portal sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { syncPortal(); }, [user.email, API_BASE_URL, token]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Notifications not supported");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("MANAGEMENT ALERTS SYNCED", { icon: '🔔', style: { background: '#000', color: '#A67C52', fontWeight: 'bold' } });
    }
  };

  const handleAction = async (id, action) => {
    if (action === 'Declined' && !hodComment) return toast.error("A reason is required to decline.");
    const loadingToast = toast.loading(`${action}ing...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action, actorRole: 'HOD', actorName: user.name, comment: hodComment || 'Approved'
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(action === 'Approved' ? 'SENT TO FINANCE' : 'DECLINED', { id: loadingToast });
      setSelectedReqId(null);
      setHodComment('');
      syncPortal();
    } catch (err) { toast.error("Action failed", { id: loadingToast }); }
  };

  const filterList = (list) => (Array.isArray(list) ? list : []).filter(req => 
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req._id.includes(searchTerm)
  );

  if (loading) return <div className="flex flex-col items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-t-4 border-[#A67C52] rounded-full mb-4"></div><p className="font-black text-[10px] uppercase tracking-widest">Syncing...</p></div>;

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black text-xs">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Management</h1>
            <p className="text-[8px] font-bold text-gray-500">HOD DASHBOARD</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!notificationsEnabled && <button onClick={handleEnableNotifications} className="bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52]">🔔 ALERTS</button>}
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 font-black text-[10px]">{user?.name?.substring(0,2).toUpperCase()}</button>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl p-6 border">
          <h4 className="text-sm font-black text-gray-900 mb-4">{user?.name || 'HOD'}</h4>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500">SIGN OUT</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">HOD <span className="text-[#A67C52]">DASHBOARD</span></h2>
          <input type="text" placeholder="SEARCH..." className="bg-white border-2 rounded-2xl px-5 py-3 text-[10px] font-bold w-full md:w-72" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="grid gap-4">
          {activeTab === 'queue' ? filterList(requisitions).map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] p-6 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xl font-black">{req.requesterName}</h3>
                <p className="text-[10px] font-bold text-gray-400">Vendor: {req.vendorName || 'General'}</p>
              </div>
              <button onClick={() => setSelectedReqId(req._id)} className="bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black hover:bg-[#A67C52]">REVIEW</button>
            </div>
          )) : <RequisitionHistory requisitions={filterList(history)} />}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 overflow-y-auto max-h-[90vh]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[ {label: 'Requester', val: selectedReq.requesterName}, {label: 'Value', val: `${selectedReq.currency} ${selectedReq.amount?.toLocaleString()}`}, 
                 {label: 'P.O. Number', val: selectedReq.poNumber}, {label: 'Invoice No', val: selectedReq.invoiceNumber},
                 {label: 'Due Date', val: new Date(selectedReq.dueDate).toLocaleDateString()}, {label: 'Payment Status', val: selectedReq.clientPaymentStatus},
                 {label: 'Mode', val: selectedReq.modeOfPayment}, {label: 'DA Ref', val: selectedReq.daRefNo} ].map((f, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-2xl border"><p className="text-[9px] text-gray-400 uppercase">{f.label}</p><p className="text-xs font-black">{f.val || 'N/A'}</p></div>
              ))}
            </div>
            <AttachmentViewer url={selectedReq.attachmentUrl} />
            <textarea value={hodComment} onChange={(e) => setHodComment(e.target.value)} placeholder="Remarks..." className="w-full h-20 p-4 border rounded-2xl my-6 text-xs" />
            <div className="flex gap-4">
              <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-[#A67C52] text-white py-4 rounded-2xl text-xs font-black">APPROVE</button>
              <button onClick={() => setSelectedReqId(null)} className="flex-1 bg-gray-200 py-4 rounded-2xl text-xs font-black">CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
