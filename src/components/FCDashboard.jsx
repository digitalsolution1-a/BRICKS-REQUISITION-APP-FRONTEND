import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null); 
  const [fcComment, setFcComment] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchFCRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/FC`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequisitions(res.data);
    } catch (err) {
      toast.error("Failed to load FC queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFCRequests();
  }, [token]);

  const filteredRequests = requisitions.filter(req => 
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVIGATION */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Finance</h1>
            <p className="text-[8px] font-bold text-gray-500">Verification Hub</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-xl hover:bg-white hover:text-black transition-all">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Vetting <span className="text-[#A67C52]">Queue</span></h2>
            <p className="text-[10px] font-bold text-[#A67C52] tracking-[0.3em] mt-2 italic">Financial Controller Review</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH QUEUE..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={exportToExcel}
              className="bg-white border-2 border-gray-100 text-black px-6 py-3 rounded-2xl text-[10px] font-black hover:border-[#A67C52] transition-all"
            >
              EXPORT
            </button>
          </div>
        </div>

        {/* LISTING */}
        <div className="grid gap-4">
          {filteredRequests.map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50">
                  <span className="text-[8px] font-black text-[#A67C52]">{req.currency}</span>
                  <span className="text-sm font-black text-gray-800">{req.amount?.toLocaleString()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded">HOD APPROVED</span>
                    <span className="text-gray-400 font-bold text-[9px] tracking-widest">{req.department}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">{req.requesterName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{req.vendorName || "General Requisition"}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedReq(req)}
                className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:bg-[#A67C52] transition-all"
              >
                VET REQUEST
              </button>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black tracking-[0.4em] text-xs">Queue Clear</p>
            </div>
          )}
        </div>
      </main>

      {/* --- FC PROCESS MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic uppercase underline decoration-[#A67C52] decoration-4 underline-offset-8">Financial Vetting</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-3 tracking-widest uppercase">Analyzing Dept: {selectedReq.department}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="border-b border-gray-50 pb-4">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Requester</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.requesterName}</p>
                </div>
                <div className="border-b border-gray-50 pb-4 text-right">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Total Value</p>
                  <p className="text-lg font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                </div>
                
                <div className="col-span-2 bg-[#FBF9F6] p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-300 mb-2 uppercase tracking-widest">Request Narrative</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>

                {/* DOCUMENT VIEWING FOR FC */}
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest italic">Verification Document</p>
                  {selectedReq.attachment ? (
                    <a 
                      href={selectedReq.attachment} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-4 bg-gray-900 text-[#A67C52] w-full py-5 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl"
                    >
                      📎 REVIEW SUPPORTING DOCUMENT (RECEIPT/INVOICE)
                    </a>
                  ) : (
                    <div className="bg-red-50 border-2 border-dashed border-red-100 py-5 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-red-400">NO SUPPORTING DOCUMENT ATTACHED</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">FC Vetting Comments</p>
                <textarea 
                  value={fcComment}
                  onChange={(e) => setFcComment(e.target.value)}
                  placeholder="Enter vetting notes for the MD or corrections for the staff..."
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2rem] p-5 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl shadow-[#A67C52]/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    FORWARD TO MD
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined')}
                    className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all"
                  >
                    DECLINE REQUEST
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
