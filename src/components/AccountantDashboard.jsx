import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RequisitionHistory from '../components/RequisitionHistory';
import AttachmentViewer from '../components/AttachmentViewer';

const AccountantDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [view, setView] = useState('queue'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null); 
  const [showProfile, setShowProfile] = useState(false);

  // New State for Payment Advice/Comments & File
  const [paymentComment, setPaymentComment] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getMDInstructions = (historyArray) => {
    if (!historyArray || !Array.isArray(historyArray)) return "Standard disbursement approved.";
    const mdEntry = [...historyArray].reverse().find(h => h.actorRole === 'MD');
    return mdEntry ? mdEntry.comment : "Standard disbursement approved.";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!token) return navigate('/');

      const [queueRes, historyRes, allDeptsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      
      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setAllDepartments(Array.isArray(allDeptsRes.data) ? allDeptsRes.data : []);
    } catch (err) {
      toast.error("Failed to sync treasury data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [API_BASE_URL, token]);

  const handlePaymentComplete = async (id) => {
    const loadingToast = toast.loading('Processing Disbursement...');
    try {
      const formData = new FormData();
      formData.append('action', 'Paid');
      formData.append('actorRole', 'ACCOUNTANT');
      formData.append('actorName', user.name || 'Accounts Dept');
      formData.append('comment', paymentComment || 'Disbursement Completed - Funds Released');
      if (paymentFile) formData.append('receipt', paymentFile);

      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      toast.success("TREASURY RECORD UPDATED", { id: loadingToast });
      setSelectedReq(null);
      setPaymentComment('');
      setPaymentFile(null);
      fetchData();
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    if (!searchTerm) return data;
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
      <div className="animate-spin h-10 w-10 border-t-4 border-[#A67C52] rounded-full mb-4"></div>
      <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">Syncing Accounts...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F9] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-xl flex items-center justify-center font-black text-xl italic text-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Treasury</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Accounts Portal</p>
          </div>
        </div>
        <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg">
          <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Accounts <span className="text-[#A67C52]">Dashboard</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-[0.2em]">Treasury Workflow Management</p>
          </div>
          <input type="text" placeholder="SEARCH..." className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-bold md:w-72" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* REPOSITIONED NAVIGATION TABS */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
            {[
              { id: 'queue', label: `ACTIVE QUEUE (${requisitions.length})` },
              { id: 'history', label: 'HISTORY' },
              { id: 'all', label: 'ALL DEPARTMENTS' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id)} 
                className={`px-6 py-3 rounded-xl text-[9px] font-black transition-all ${view === tab.id ? 'bg-[#A67C52] text-black shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-6">
          {view === 'queue' && filterList(requisitions).map(req => (
            <div key={req._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black">{req.vendorName}</h2>
                <p className="text-[10px] font-bold text-gray-400">STAGE: {req.currentStage}</p>
              </div>
              <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black">PROCESS PAYMENT</button>
            </div>
          ))}
          {view === 'history' && <RequisitionHistory requisitions={filterList(history)} />}
          {view === 'all' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">...[All Departments Data View]...</div>}
        </div>
      </main>

      {/* DISBURSEMENT MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-6">PROCESS PAYMENT</h3>
            
            <div className="mb-6">
              <p className="text-[8px] font-black text-gray-400 mb-2">ATTACHMENT / PAYMENT ADVISE</p>
              <input type="file" onChange={(e) => setPaymentFile(e.target.files[0])} className="w-full text-xs" />
            </div>

            <div className="mb-8">
              <p className="text-[8px] font-black text-gray-400 mb-2">COMMENT / PAYMENT NOTES</p>
              <textarea className="w-full bg-gray-50 p-4 rounded-xl text-xs" placeholder="Add payment instructions..." onChange={(e) => setPaymentComment(e.target.value)} />
            </div>

            <div className="flex gap-4">
              <button onClick={() => handlePaymentComplete(selectedReq._id)} className="flex-1 bg-black text-white py-4 rounded-2xl text-[10px] font-black">CONFIRM DISBURSEMENT</button>
              <button onClick={() => setSelectedReq(null)} className="px-8 py-4 rounded-2xl text-[10px] font-black bg-gray-100">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
