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

      if ('setAppBadge' in navigator) {
        queueRes.data.length > 0 ? navigator.setAppBadge(queueRes.data.length) : navigator.clearAppBadge();
      }
    } catch (err) {
      toast.error("Failed to sync treasury data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [API_BASE_URL, token]);

  const handlePaymentComplete = async (id) => {
    const loadingToast = toast.loading('Processing...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: 'Paid',
        actorRole: 'ACCOUNTANT',
        actorName: user.name || 'Accounts Dept',
        comment: 'Disbursement Completed - Funds Released'
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("DISBURSEMENT COMPLETED", { id: loadingToast });
      setSelectedReq(null);
      fetchData();
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse">SYNCING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex">
      {/* LEFT NAVIGATION SIDEBAR */}
      <nav className="w-64 bg-black p-8 flex flex-col justify-between fixed h-full z-50">
        <div>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-[#A67C52] rounded-xl flex items-center justify-center font-black text-xl italic text-black">B</div>
            <h1 className="text-[10px] font-black text-[#A67C52] tracking-widest">BRICKS REQUISITION PORTAL</h1>
          </div>
          <div className="space-y-2">
            {[ { id: 'queue', label: 'ACTIVE QUEUE' }, { id: 'history', label: 'HISTORY' }, { id: 'all', label: 'ALL DEPTS' } ].map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)} className={`w-full text-left px-6 py-4 rounded-2xl text-[9px] font-black transition-all ${view === tab.id ? 'bg-[#A67C52] text-black' : 'text-gray-500 hover:text-white'}`}>
                {tab.label} {tab.id === 'queue' && `(${requisitions.length})`}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 text-white border border-gray-800 p-3 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-[#A67C52] flex items-center justify-center text-[10px] font-black">{user?.name?.substring(0,2).toUpperCase()}</div>
          <span className="text-[9px] font-black">{user?.name || 'USER'}</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="ml-64 flex-1 p-10 uppercase">
        <div className="mb-10">
          <h1 className="text-3xl font-black italic">ACCOUNT <span className="text-[#A67C52]">DEPARTMENT</span></h1>
          <p className="text-[10px] font-bold text-gray-400 mt-2">TREASURY WORKFLOW MANAGEMENT</p>
        </div>

        <input type="text" placeholder="SEARCH..." className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-bold mb-8" onChange={(e) => setSearchTerm(e.target.value)} />

        <div className="space-y-4">
          {(view === 'queue' ? filterList(requisitions) : view === 'history' ? filterList(history) : filterList(allDepartments)).map(req => (
            <div key={req._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black">{req.vendorName}</h2>
                <p className="text-[9px] text-gray-400">REF: {req._id}</p>
              </div>
              <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-6 py-3 rounded-xl text-[9px] font-black hover:bg-[#A67C52]">
                {view === 'queue' ? 'PROCESS PAYMENT' : 'VIEW RECORD'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black mb-6">DISBURSEMENT: {selectedReq.vendorName}</h3>
            <div className="bg-gray-50 p-4 rounded-2xl mb-4"><p className="text-[10px] font-black">MD INSTRUCTION: {getMDInstructions(selectedReq.approvalHistory)}</p></div>
            <div className="mb-6"><AttachmentViewer url={selectedReq.attachmentUrl} /></div>
            <div className="flex gap-4">
              <button onClick={() => handlePaymentComplete(selectedReq._id)} className="flex-1 bg-black text-white py-4 rounded-2xl text-[10px] font-black">CONFIRM PAYMENT</button>
              <button onClick={() => setSelectedReq(null)} className="px-8 py-4 rounded-2xl text-[10px] font-black bg-gray-100">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
