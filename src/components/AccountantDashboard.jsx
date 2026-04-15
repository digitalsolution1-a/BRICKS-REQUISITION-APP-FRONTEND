import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RequisitionHistory from '../components/RequisitionHistory';
import AttachmentViewer from '../components/AttachmentViewer'; // Assuming this component exists

const AccountantDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('queue'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null); // Track requisition for modal review
  
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // --- HELPER: GET MD DISBURSEMENT INSTRUCTIONS ---
  const getMDInstructions = (historyArray) => {
    if (!historyArray || !Array.isArray(historyArray)) return "Standard disbursement approved.";
    const mdEntry = [...historyArray].reverse().find(h => h.actorRole === 'MD');
    return mdEntry ? mdEntry.comment : "Standard disbursement approved.";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!token) return navigate('/');

      const [queueRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);
      
      const queueData = Array.isArray(queueRes.data) ? queueRes.data : [];
      const historyData = Array.isArray(historyRes.data) ? historyRes.data : [];

      setRequisitions(queueData);
      setHistory(historyData);

      if ('setAppBadge' in navigator) {
        queueData.length > 0 ? navigator.setAppBadge(queueData.length) : navigator.clearAppBadge();
      }

    } catch (err) {
      console.error("Treasury Sync Error:", err);
      toast.error("Failed to sync treasury data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_BASE_URL, token]);

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  const exportToCSV = () => {
    const dataToExport = view === 'queue' ? filterList(requisitions) : filterList(history);
    if (dataToExport.length === 0) return toast.error("No data to export");
    
    const headers = "ID,Date,Due Date,Requester,Dept,Vendor,Amount,Currency,Status\n";
    const rows = dataToExport.map(r => {
      return `${r._id},${new Date(r.createdAt).toLocaleDateString()},${new Date(r.dueDate).toLocaleDateString()},${r.requesterName},${r.department},${r.vendorName || 'N/A'},${r.amount},${r.currency},${r.status}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_Treasury_${view.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePaymentComplete = async (id) => {
    const loadingToast = toast.loading('Recording Disbursement...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: 'Paid', 
        actorRole: 'ACCOUNTANT',
        actorName: user.name || 'Accounts Dept',
        comment: 'Disbursement Completed - Funds Released'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("TREASURY RECORD UPDATED", { id: loadingToast });
      setSelectedReq(null); // Close modal
      fetchData(); // Refresh both lists
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
      <div className="animate-spin h-10 w-10 border-t-4 border-[#A67C52] border-solid rounded-full mb-4"></div>
      <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">Syncing Treasury Ledger...</p>
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
          <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setView('queue')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${view === 'queue' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}
            >
              ACTIVE QUEUE
            </button>
            <button 
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${view === 'history' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}
            >
              HISTORY
            </button>
          </div>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg"
          >
            <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</span>
          </button>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'AC'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Accountant'}</h4>
            <p className="text-[9px] font-bold text-green-500 mt-2 tracking-widest">TREASURY ACCESS: ACTIVE</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-center px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
            End Session
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
              {view === 'queue' ? 'Accounts ' : 'Disbursement '}<span className="text-[#A67C52]">{view === 'queue' ? 'Ledger' : 'Archive'}</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3 underline decoration-[#A67C52] decoration-2 underline-offset-4">
              {view === 'queue' ? `Disbursement Queue (${requisitions.length})` : `Total Records (${history.length})`}
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH VENDOR OR REF..."
              className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={exportToCSV} className="bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A67C52] shadow-lg flex items-center gap-2">
              📥 EXPORT
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {view === 'queue' ? (
            <>
              {filterList(requisitions).map(req => (
                <div key={req._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                  <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[8px] font-black px-3 py-1 rounded-full tracking-widest bg-green-100 text-green-600">READY FOR DISBURSEMENT</span>
                        <span className="text-gray-300 font-bold text-[9px] tracking-widest">#{req._id.slice(-6)}</span>
                      </div>
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{req.vendorName || "General Requisition"}</h2>
                      <div className="flex gap-6 mt-2">
                         <p className="text-[10px] font-bold text-gray-500 underline underline-offset-4 decoration-[#A67C52]">{req.requesterName}</p>
                         <p className="text-[10px] font-bold text-gray-400">{req.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                          <p className="text-2xl font-black text-gray-900">{req.currency} {req.amount.toLocaleString()}</p>
                       </div>
                       <button 
                        onClick={() => setSelectedReq(req)} 
                        className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] shadow-lg transition-all active:scale-95"
                       >
                         PROCESS PAYMENT
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              {filterList(requisitions).length === 0 && (
                <div className="py-32 text-center bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
                  <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs underline decoration-[#A67C52] decoration-2 underline-offset-8">No Pending Disbursements</p>
                </div>
              )}
            </>
          ) : (
            <RequisitionHistory requisitions={filterList(history)} />
          )}
        </div>
      </main>

      {/* DISBURSEMENT MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">Confirm Disbursement</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-5 tracking-widest uppercase tracking-[0.2em]">Final Treasury Verification: #{selectedReq._id.slice(-6)}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">✕</button>
              </div>

              {/* EXECUTIVE INSTRUCTION HIGHLIGHT */}
              <div className="bg-[#FBF9F6] border-2 border-[#A67C52] p-8 rounded-[2.5rem] mb-8 shadow-inner">
                <p className="text-[9px] font-black text-[#A67C52] uppercase tracking-[0.2em] mb-2 italic">MD's Payment Instructions:</p>
                <p className="text-lg font-black text-gray-800 italic leading-snug">
                  "{getMDInstructions(selectedReq.approvalHistory)}"
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Beneficiary</p>
                  <p className="text-[11px] font-bold text-gray-800 truncate">{selectedReq.beneficiaryDetails}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Mode</p>
                  <p className="text-[11px] font-bold text-gray-800">{selectedReq.modeOfPayment}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Due Date</p>
                  <p className="text-[11px] font-black text-red-500">{new Date(selectedReq.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Total Value</p>
                  <p className="text-[11px] font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-6 mb-10 text-left">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest italic">Narrative / Description</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-2 bg-gray-50">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest p-4">Proof of Obligation / Invoice</p>
                  <div className="w-full bg-white rounded-[2rem] p-4 min-h-[300px]">
                    <AttachmentViewer url={selectedReq.attachmentUrl} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => handlePaymentComplete(selectedReq._id)} 
                  className="flex-1 bg-black text-white py-6 rounded-[2rem] text-[10px] font-black tracking-[0.3em] shadow-xl hover:bg-green-600 transition-all active:scale-95"
                >
                  CONFIRM DISBURSEMENT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
