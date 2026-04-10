import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null); // For the "Process" Detail View
  const [fcComment, setFcComment] = useState('');
  
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchFCRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/FC`);
      setRequisitions(res.data);
    } catch (err) {
      toast.error("Failed to load FC queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFCRequests();
  }, []);

  // --- Search & Filter Logic ---
  const filteredRequests = requisitions.filter(req => 
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Export to Excel (CSV) ---
  const exportToExcel = () => {
    const headers = "ID,Date,Requester,Department,Vendor,Amount,Currency,Status\n";
    const data = filteredRequests.map(r => 
      `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.department},${r.vendorName},${r.amount},${r.currency},HOD_APPROVED`
    ).join("\n");
    
    const blob = new Blob([headers + data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FC_Vetting_Queue_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAction = async (id, action) => {
    if (!fcComment && action === 'Declined') {
      return toast.error("Please provide instructions/reason for decline");
    }

    const loadingToast = toast.loading('Processing decision...');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'FC',
        actorName: user.name,
        comment: fcComment || (action === 'Approved' ? 'Vetted and cleared for MD' : 'Declined at FC stage')
      });
      
      toast.success(`Request ${action} successfully`, { id: loadingToast });
      setRequisitions(prev => prev.filter(r => r._id !== id));
      setSelectedReq(null);
      setFcComment('');
    } catch (err) {
      toast.error("Action failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-[#A67C52] border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      {/* NAVIGATION */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black">B</div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-[#A67C52]">Bricks Finance</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Verification Hub</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-xl hover:bg-white hover:text-black transition-all">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Vetting Queue</h2>
            <p className="text-[10px] font-bold text-[#A67C52] uppercase tracking-[0.3em] mt-1">Financial Controller Vetting</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH QUEUE..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={exportToExcel}
              className="bg-[#A67C52] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#A67C52]/20"
            >
              Export
            </button>
          </div>
        </div>

        {/* REQUISITION CARDS */}
        <div className="grid gap-4">
          {filteredRequests.map(req => (
            <div key={req._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6 w-full">
                <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50">
                  <span className="text-[8px] font-black text-[#A67C52] uppercase">{req.currency}</span>
                  <span className="text-sm font-black text-gray-800">{req.amount > 1000 ? `${(req.amount/1000).toFixed(1)}k` : req.amount}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">HOD Approved</span>
                    <span className="text-gray-300 font-bold text-[9px] uppercase tracking-widest">{req.department}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{req.vendorName || "General Requisition"}</h3>
                  <p className="text-[10px] font-bold text-gray-400">REQUESTED BY: {req.requesterName}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedReq(req)}
                className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#A67C52] transition-colors shadow-xl"
              >
                Process
              </button>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs font-black">Finance Queue Clear</p>
            </div>
          )}
        </div>
      </main>

      {/* --- PROCESS MODAL (DETAILED VIEW) --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase">Requisition Details</h3>
                  <p className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest">Reviewing Item #{selectedReq._id.slice(-6)}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="text-gray-300 hover:text-black font-black text-xl">✕</button>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-2 gap-8 mb-10 text-left">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Requester</p>
                  <p className="font-bold text-gray-800">{selectedReq.requesterName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Amount</p>
                  <p className="font-black text-xl text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Purpose / Description</p>
                  <p className="font-bold text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">"{selectedReq.description}"</p>
                </div>
                {selectedReq.attachment && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Attached Document</p>
                    <a 
                      href={selectedReq.attachment} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 bg-blue-50 text-blue-600 px-5 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-all"
                    >
                      📎 View Supporting Document
                    </a>
                  </div>
                )}
              </div>

              {/* FC DECISION AREA */}
              <div className="bg-[#FBF9F6] p-8 rounded-[2rem] border border-gray-100">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-3">Vetting Instructions / Comments</p>
                <textarea 
                  value={fcComment}
                  onChange={(e) => setFcComment(e.target.value)}
                  placeholder="Enter specific vetting details for the MD or instructions for the requester..."
                  className="w-full h-32 bg-white border-2 border-gray-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#A67C52] mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-3">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    className="flex-1 bg-[#A67C52] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-[#A67C52]/20"
                  >
                    Send to MD for Approval
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined')}
                    className="flex-1 bg-white border-2 border-red-50 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50"
                  >
                    Decline Requisition
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

export default FCDashboard;
