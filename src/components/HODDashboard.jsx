import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null); 
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

  const filteredRequests = requisitions.filter(req => 
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <p className="font-black text-[#A67C52] text-[10px] tracking-widest uppercase tracking-tighter">Syncing HOD Portal...</p>
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
            <p className="text-[8px] font-bold text-gray-500">HOD Approval Interface</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/profile')} className="text-[10px] font-black border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5 transition-all">PROFILE</button>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black bg-[#A67C52] px-4 py-2 rounded-xl hover:bg-white hover:text-black transition-all text-white">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Review <span className="text-[#A67C52]">Queue</span></h2>
            <p className="text-[10px] font-bold text-gray-400 tracking-[0.3em] mt-2 italic">{user.department} Department</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH BY STAFF OR VENDOR..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{req.requesterName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{req.vendorName || 'Internal Request'}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedReq(req)}
                className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-lg hover:bg-[#A67C52] transition-all"
              >
                Process Requisition
              </button>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black tracking-[0.4em] text-xs">No pending approvals</p>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL ENGINE (Fixes Responsiveness) --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4">Process Review</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-2">VERIFYING STAFF SUBMISSION</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between border-b border-gray-50 pb-4">
                  <span className="text-[10px] font-black text-gray-400">STAFF NAME</span>
                  <span className="text-xs font-black text-gray-800 uppercase">{selectedReq.requesterName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-4">
                  <span className="text-[10px] font-black text-gray-400">TOTAL PAYABLE</span>
                  <span className="text-lg font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</span>
                </div>
                <div className="bg-[#FBF9F6] p-6 rounded-3xl border border-gray-100 italic">
                  <p className="text-[10px] font-black text-gray-300 mb-2 uppercase tracking-widest">Description</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed leading-none">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>
                
                {selectedReq.attachment && (
                  <a 
                    href={selectedReq.attachment} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 bg-gray-900 text-[#A67C52] w-full py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black"
                  >
                    📎 VIEW SUPPORTING DOCUMENT
                  </a>
                )}
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">Internal HOD Comments</p>
                <textarea 
                  value={hodComment}
                  onChange={(e) => setHodComment(e.target.value)}
                  placeholder="Provide instructions for the FC or reason for rejection..."
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2rem] p-5 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl shadow-[#A67C52]/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    APPROVE TO FINANCE
                  </button>
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Declined')}
                    className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all"
                  >
                    DECLINE
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
