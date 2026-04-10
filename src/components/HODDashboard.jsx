import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null); // For the Detail Modal
  const [hodComment, setHodComment] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      if (!user.email) throw new Error("User session expired. Please login again.");

      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequisitions(res.data);
    } catch (err) {
      setError(err.message);
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [user.email, API_BASE_URL, token]);

  // --- Search Logic ---
  const filteredRequests = requisitions.filter(req => 
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Export Logic ---
  const exportToExcel = () => {
    const headers = "ID,Date,Requester,Vendor,Amount,Currency\n";
    const csvContent = filteredRequests.map(r => 
      `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.vendorName},${r.amount},${r.currency}`
    ).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HOD_Pending_Approvals.csv`;
    a.click();
  };

  const handleAction = async (id, action) => {
    if (action === 'Declined' && !hodComment) {
      return toast.error("Please provide a reason for declining.");
    }

    const loadingToast = toast.loading(`${action}ing requisition...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'HOD',
        actorName: user.name,
        comment: hodComment || (action === 'Approved' ? 'Departmental approval granted.' : '')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Requisition ${action}`, { id: loadingToast });
      setRequisitions(prev => prev.filter(r => r._id !== id));
      setSelectedReq(null);
      setHodComment('');
    } catch (err) {
      toast.error("Action failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF9F6]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#A67C52] mb-4"></div>
      <p className="font-black text-[#A67C52] text-[10px] tracking-widest uppercase">Syncing HOD Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-xl flex items-center justify-center font-black text-xl">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Management</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">HOD Approval Interface</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/profile')} className="text-[10px] font-black border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5 transition-all">PROFILE</button>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black bg-[#A67C52] px-4 py-2 rounded-xl hover:bg-white hover:text-black transition-all">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Departmental <span className="text-[#A67C52]">Review</span></h2>
            <p className="text-[10px] font-bold text-gray-400 tracking-[0.3em] mt-1 italic">Pending Approvals for {user.department || 'Your Department'}</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH BY NAME/VENDOR..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={exportToExcel} className="bg-white border-2 border-gray-100 text-black px-6 py-3 rounded-2xl text-[10px] font-black hover:border-[#A67C52]">EXPORT</button>
          </div>
        </div>

        {/* LISTING */}
        <div className="grid gap-4">
          {filteredRequests.map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50 group-hover:border-[#A67C52] transition-colors">
                  <span className="text-[8px] font-black text-[#A67C52]">{req.currency}</span>
                  <span className="text-sm font-black text-gray-800">{req.amount?.toLocaleString()}</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#A67C52] mb-1 tracking-widest">PENDING YOUR REVIEW</p>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1 tracking-tight">{req.requesterName}</h3>
                  <p className="text-[10px] font-bold text-gray-400">{req.vendorName || 'General Requisition'}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden md:block border-r border-gray-100 pr-8">
                   <p className="text-[8px] font-black text-gray-300 uppercase">Submission Date</p>
                   <p className="text-[10px] font-black text-gray-600">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedReq(req)}
                  className="bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:bg-[#A67C52] transition-all"
                >
                  Process
                </button>
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black tracking-[0.4em] text-xs">Queue Clear</p>
            </div>
          )}
        </div>
      </main>

      {/* --- PROCESS MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 uppercase">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border border-white/20">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic">Requisition Detail</h3>
                  <p className="text-[10px] font-bold text-[#A67C52] tracking-widest mt-1">Ref ID: {selectedReq._id.slice(-8)}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="bg-gray-50 h-10 w-10 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[9px] font-black text-gray-400 mb-1">Requester Name</p>
                  <p className="font-black text-gray-800 text-sm">{selectedReq.requesterName}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[9px] font-black text-gray-400 mb-1">Total Amount Requested</p>
                  <p className="font-black text-xl text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-gray-400 mb-2 font-black italic">Detailed Purpose</p>
                  <div className="bg-[#FBF9F6] p-6 rounded-2xl border border-gray-100 italic text-[11px] font-bold text-gray-600 leading-relaxed">
                    "{selectedReq.requestNarrative || selectedReq.description}"
                  </div>
                </div>
                {selectedReq.attachment && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-gray-400 mb-2">Support Document</p>
                    <a 
                      href={selectedReq.attachment} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 bg-gray-900 text-[#A67C52] px-6 py-3 rounded-xl text-[9px] font-black tracking-widest hover:bg-black transition-all"
                    >
                      📎 View Original Document
                    </a>
                  </div>
                )}
              </div>

              {/* ACTION AREA */}
              <div className="border-t border-gray-100 pt-8 mt-4">
                <p className="text-[9px] font-black text-gray-400 mb-3">HOD Review Comments</p>
                <textarea 
                  value={hodComment}
                  onChange={(e) => setHodComment(e.target.value)}
                  placeholder="Enter comments or instructions for finance vetting..."
                  className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-[2rem] p-5 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-lg shadow-[#A67C52]/30 hover:bg-black transition-all"
                  >
                    Approve & Forward to Finance
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined')}
                    className="flex-1 bg-white border-2 border-red-100 text-red-500 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all"
                  >
                    Decline Request
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

export default HODDashboard;
