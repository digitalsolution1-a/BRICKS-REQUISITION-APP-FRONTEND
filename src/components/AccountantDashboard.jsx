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

  // New states for extended features
  const [paymentComment, setPaymentComment] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);

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

  const handlePaymentComplete = async (id, isVerification = false) => {
    const loadingToast = toast.loading(isVerification ? 'Updating Status...' : 'Recording Disbursement...');
    try {
      const formData = new FormData();
      formData.append('action', isVerification ? 'Verify' : 'Paid');
      formData.append('actorRole', 'ACCOUNTANT');
      formData.append('actorName', user.name || 'Accounts Dept');
      formData.append('comment', paymentComment || (isVerification ? 'Verification requested' : 'Disbursement Completed - Funds Released'));
      
      if (paymentReceiptFile) {
        formData.append('receipt', paymentReceiptFile);
      }

      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(isVerification ? "VERIFICATION UPDATED" : "TREASURY RECORD UPDATED", { id: loadingToast });
      setSelectedReq(null);
      setPaymentComment('');
      setPaymentReceiptFile(null);
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

  const exportToCSV = () => {
    let dataToExport = view === 'queue' ? requisitions : view === 'history' ? history : allDepartments;
    const filteredData = filterList(dataToExport);
    if (filteredData.length === 0) return toast.error("No data to export");
    const headers = "ID,Date,Due Date,Requester,Dept,Vendor,Amount,Currency,Status\n";
    const rows = filteredData.map(r => `${r._id},${new Date(r.createdAt).toLocaleDateString()},${new Date(r.dueDate).toLocaleDateString()},${r.requesterName},${r.department},${r.vendorName || 'N/A'},${r.amount},${r.currency},${r.status}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_Treasury_${view.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
      <div className="animate-spin h-10 w-10 border-t-4 border-[#A67C52] border-solid rounded-full mb-4"></div>
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
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
            <button onClick={() => setView('queue')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${view === 'queue' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>ACTIVE QUEUE</button>
            <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${view === 'history' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>HISTORY</button>
            <button onClick={() => setView('all')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${view === 'all' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>ALL DEPARTMENTS ({allDepartments.length})</button>
          </div>
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg">
            <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</span>
          </button>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Accountant'}</h4>
            <p className="text-[9px] font-bold text-green-500 mt-2 tracking-widest">Account ACCESS: ACTIVE</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-center px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">SIGN OUT</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">{view === 'queue' ? 'Accounts ' : 'System '}<span className="text-[#A67C52]">{view === 'queue' ? 'Dashboard' : 'Records'}</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-3 underline decoration-[#A67C52] decoration-2 underline-offset-4">{view === 'queue' ? `Upload Queue (${requisitions.length})` : `Total Records (${history.length + allDepartments.length})`}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="text" placeholder="SEARCH VENDOR OR REF..." className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52]" onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={exportToCSV} className="bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black hover:bg-[#A67C52]">📥 EXPORT</button>
          </div>
        </div>

        {view === 'queue' && (
          <div className="space-y-6">
            {filterList(requisitions).map(req => (
              <div key={req._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black">{req.vendorName || "General Requisition"}</h2>
                  <p className="text-[10px] font-bold text-gray-400">{req.department}</p>
                </div>
                <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-[#A67C52]">PROCESS PAYMENT</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DISBURSEMENT MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-black italic underline decoration-[#A67C52] decoration-4">FINALIZE DISBURSEMENT</h3>
              <button onClick={() => setSelectedReq(null)} className="font-black text-gray-400">✕</button>
            </div>

            <div className="mb-6">
              <p className="text-[9px] font-black text-[#A67C52] italic mb-2">MD INSTRUCTION:</p>
              <p className="text-sm font-bold bg-gray-50 p-4 rounded-xl italic">"{getMDInstructions(selectedReq.approvalHistory)}"</p>
            </div>

            <div className="mb-6">
              <label className="block text-[8px] font-black text-gray-400 mb-2">ATTACH PAYMENT RECEIPT (OPTIONAL)</label>
              <input type="file" onChange={(e) => setPaymentReceiptFile(e.target.files[0])} className="w-full text-xs border p-3 rounded-2xl" />
            </div>

            <div className="mb-8">
              <label className="block text-[8px] font-black text-gray-400 mb-2">PAYMENT / VERIFICATION NOTE</label>
              <textarea className="w-full bg-gray-50 border p-4 rounded-xl text-xs" rows="3" placeholder="Add notes..." onChange={(e) => setPaymentComment(e.target.value)} />
            </div>

            <div className="flex gap-4">
              <button onClick={() => handlePaymentComplete(selectedReq._id, true)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl text-[10px] font-black">VERIFY ONLY</button>
              <button onClick={() => handlePaymentComplete(selectedReq._id)} className="flex-1 bg-black text-white py-4 rounded-2xl text-[10px] font-black">CONFIRM DISBURSEMENT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
