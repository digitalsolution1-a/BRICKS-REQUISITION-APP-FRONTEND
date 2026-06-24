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
  const [user, setUser] = useState({});
  const [token, setToken] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Safe initialization of user and session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (!storedUser || !storedToken) {
      navigate('/');
    } else {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [navigate]);

  const selectedReq = [...requisitions, ...history].find((r) => r._id === selectedReqId) || null;

  const syncPortal = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!storedToken || !storedUser.email) return;

    try {
      setLoading(true);
      const [queueRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${storedUser.email}`, { headers: { Authorization: `Bearer ${storedToken}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history/HOD?email=${storedUser.email}`, { headers: { Authorization: `Bearer ${storedToken}` } }).catch(() => ({ data: [] }))
      ]);

      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) syncPortal();
  }, [token]);

  const handleAction = async (id, action) => {
    if (action === 'Declined' && !hodComment) return toast.error("Reason required for decline.");
    const loadingToast = toast.loading(`${action}ing...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action, actorRole: 'HOD', actorName: user.name,
        comment: hodComment || (action === 'Approved' ? 'Approved.' : '')
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Success", { id: loadingToast });
      setSelectedReqId(null);
      setHodComment('');
      syncPortal();
    } catch (err) {
      toast.error("Action failed", { id: loadingToast });
    }
  };

  if (loading && requisitions.length === 0) return (
    <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-[#A67C52] border-t-transparent rounded-full"></div></div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-black text-[#A67C52]">BRICKS HOD</h1>
        <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border border-[#A67C52]">{user?.name?.substring(0, 2)}</button>
      </nav>

      {/* DASHBOARD */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 mb-8">
          <button onClick={() => setActiveTab('queue')} className={activeTab === 'queue' ? 'font-black underline' : 'text-gray-400'}>PENDING ({requisitions.length})</button>
          <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'font-black underline' : 'text-gray-400'}>HISTORY ({history.length})</button>
        </div>

        <div className="grid gap-4">
          {activeTab === 'queue' ? requisitions.map(req => (
            <div key={req._id} className="bg-white p-6 rounded-3xl flex justify-between items-center shadow-sm">
              <div><h3 className="font-black">{req.requesterName}</h3><p className="text-[10px]">{req.vendorName}</p></div>
              <button onClick={() => setSelectedReqId(req._id)} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black">REVIEW</button>
            </div>
          )) : <RequisitionHistory requisitions={history} />}
        </div>
      </main>

      {/* MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-black">REVIEW REQUEST</h2>
              <button onClick={() => setSelectedReqId(null)} className="font-black">✕</button>
            </div>
            <div className="mb-6 space-y-2 text-xs">
              <p><strong>REQUESTER:</strong> {selectedReq.requesterName}</p>
              <p><strong>AMOUNT:</strong> {selectedReq.amount} {selectedReq.currency}</p>
            </div>
            <textarea className="w-full border p-4 rounded-xl mb-4" placeholder="Comments..." onChange={(e) => setHodComment(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black">APPROVE</button>
              <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black">DECLINE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
