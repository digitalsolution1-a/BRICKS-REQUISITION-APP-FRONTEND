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
        axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history/HOD?email=${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);

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
      setSelectedReqId(null);
      setHodComment('');
      syncPortal(); 
    } catch (err) {
      toast.error("Action could not be processed", { id: loadingToast });
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
        <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all">
          <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'HO'}</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none italic">HOD <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button onClick={() => setActiveTab('queue')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'queue' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>PENDING APPROVAL ({requisitions.length})</button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>ACTION HISTORY ({history.length})</button>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input type="text" placeholder="SEARCH..." className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52]" onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={exportData} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-[#A67C52]">EXPORT</button>
          </div>
        </div>

        <div className="grid gap-4">
          {activeTab === 'queue' ? filterList(requisitions).map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-gray-900">{req.requesterName}</h3>
                <p className="text-[10px] font-bold text-gray-400">Vendor: {req.vendorName || 'General'}</p>
              </div>
              <button onClick={() => setSelectedReqId(req._id)} className="bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black hover:bg-[#A67C52]">REVIEW REQUEST</button>
            </div>
          )) : <RequisitionHistory requisitions={filterList(history)} />}
        </div>
      </main>

      {/* --- ENHANCED MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-12 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black">DEPARTMENTAL REVIEW</h3>
                <p className="text-[10px] text-gray-400 uppercase">ID: #{selectedReq._id.slice(-6)}</p>
              </div>
              <button onClick={() => setSelectedReqId(null)} className="text-xl">✕</button>
            </div>

            {/* FULL DATA GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Requester', val: selectedReq.requesterName },
                { label: 'Amount', val: `${selectedReq.currency} ${selectedReq.amount?.toLocaleString()}` },
                { label: 'P.O. Number', val: selectedReq.poNumber },
                { label: 'Invoice No', val: selectedReq.invoiceNumber },
                { label: 'Due Date', val: new Date(selectedReq.dueDate).toLocaleDateString() },
                { label: 'Payment Status', val: selectedReq.clientPaymentStatus },
                { label: 'Mode', val: selectedReq.modeOfPayment },
                { label: 'DA Ref', val: selectedReq.daRefNo }
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] text-gray-400 uppercase">{f.label}</p>
                  <p className="text-xs font-black">{f.val || 'N/A'}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 p-6 rounded-3xl text-white mb-6">
              <p className="text-[9px] text-[#A67C52]">ACCOUNT DETAILS</p>
              <p className="text-xs font-bold">{selectedReq.beneficiaryDetails || selectedReq.accountDetails || 'NOT PROVIDED'}</p>
            </div>

            <div className="mb-8">
              <p className="text-[9px] text-gray-400 uppercase mb-2">Description</p>
              <p className="text-xs font-bold bg-[#FBF9F6] p-4 rounded-2xl">{selectedReq.requestNarrative || selectedReq.description}</p>
            </div>

            <AttachmentViewer url={selectedReq.attachmentUrl} />

            <textarea value={hodComment} onChange={(e) => setHodComment(e.target.value)} placeholder="Remarks..." className="w-full p-4 bg-gray-50 rounded-2xl my-6 text-xs" />

            <div className="flex gap-4">
              <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-[#A67C52] text-white py-4 rounded-2xl text-xs font-black">APPROVE</button>
              <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl text-xs font-black">DECLINE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
