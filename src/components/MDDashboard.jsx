import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MDDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); 
  const [selectedReq, setSelectedReq] = useState(null); 
  const [mdComment, setMdComment] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const syncPortal = async () => {
    if (!token) {
      toast.error("Session expired. Please login.");
      return navigate('/');
    }

    try {
      setLoading(true);
      
      // Pull Pending Final Approvals
      try {
        const queueRes = await axios.get(`${API_BASE_URL}/requisitions/pending/MD`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      } catch (err) {
        console.error("Queue sync failed:", err);
      }

      // Pull Executive History
      try {
        const historyRes = await axios.get(`${API_BASE_URL}/requisitions/history/MD`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch (err) {
        console.warn("History currently empty or unavailable");
      }

    } catch (globalErr) {
      toast.error("Critical Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncPortal();
  }, [API_BASE_URL, token]);

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const exportCSV = () => {
    const dataToExport = activeTab === 'queue' ? filterList(requisitions) : filterList(history);
    if (dataToExport.length === 0) return toast.error("No data to export");

    const headers = "Date,Department,Staff,Amount,Currency,Vendor,Status\n";
    const csvContent = dataToExport.map(r => 
      `${new Date(r.createdAt).toLocaleDateString()},${r.department},${r.requesterName},${r.amount},${r.currency},${r.vendorName || 'N/A'},${r.status}`
    ).join("\n");

    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Executive_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleAction = async (id, action) => {
    const loadingToast = toast.loading(`Processing ${action}...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'MD',
        actorName: user.name,
        comment: mdComment || (action === 'Approved' ? 'Final authorization granted.' : 'Declined by Executive Office.')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Request ${action}ed`, { id: loadingToast });
      setSelectedReq(null);
      setMdComment('');
      syncPortal(); 
    } catch (err) {
      toast.error("Action failed to register", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF9F6]">
      <div className="w-12 h-12 border-t-4 border-black border-solid rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-black tracking-widest text-gray-400">AUTHORIZING ACCESS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVIGATION */}
      <nav className="bg-black text-white px-8 py-6 flex justify-between items-center sticky top-0 z-50 border-b border-[#A67C52]/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-full flex items-center justify-center font-black text-lg">MD</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Executive Authority</h1>
            <p className="text-[8px] font-bold text-gray-500">Bricks Mursten Mattoni</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button onClick={exportCSV} className="hidden md:block text-[10px] font-black border border-white/20 px-6 py-2 rounded-full hover:bg-white/10 transition-all">EXPORT REPORT</button>
           <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black bg-[#A67C52] px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 mt-6">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">DIRECTOR'S <span className="text-[#A67C52]">OVERSIGHT</span></h2>
            <div className="flex gap-8 mt-8">
              <button onClick={() => setActiveTab('queue')} className={`text-[10px] font-black tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'queue' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
                PENDING FINAL ({requisitions.length})
              </button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'history' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
                ACTION HISTORY ({history.length})
              </button>
            </div>
          </div>
          <input 
            type="text" 
            placeholder="SEARCH BY DEPT OR STAFF..." 
            className="bg-white border-2 border-gray-100 rounded-full px-8 py-4 text-[10px] font-bold flex-1 md:w-96 outline-none focus:border-black shadow-lg"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-6">
          {activeTab === 'queue' ? (
            filterList(requisitions).map(req => (
              <div key={req._id} className="bg-white rounded-[3rem] border-l-[12px] border-l-[#A67C52] p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm hover:shadow-xl transition-all">
                <div className="flex items-center gap-8 flex-1">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 mb-1">{req.currency}</p>
                    <p className="text-2xl font-black text-gray-900">{req.amount?.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-[1px] bg-gray-100"></div>
                  <div>
                    <span className="bg-black text-[#A67C52] text-[8px] font-black px-2 py-1 rounded mb-2 inline-block">{req.department}</span>
                    <h3 className="text-xl font-black text-gray-900">{req.requesterName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic tracking-widest">{req.vendorName || "General Fund Request"}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReq(req)} className="w-full md:w-auto bg-black text-white px-12 py-5 rounded-full text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">REVIEW</button>
              </div>
            ))
          ) : (
            /* HISTORY LIST */
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-8 text-[10px] font-black text-gray-400">STAFF / DATE</th>
                    <th className="p-8 text-[10px] font-black text-gray-400">DEPARTMENT</th>
                    <th className="p-8 text-[10px] font-black text-gray-400">AMOUNT</th>
                    <th className="p-8 text-[10px] font-black text-gray-400 text-right">OUTCOME</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(history).map(req => (
                    <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-8">
                        <p className="text-[11px] font-black text-gray-900">{req.requesterName}</p>
                        <p className="text-[8px] font-bold text-gray-400">{new Date(req.updatedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-8 text-[10px] font-bold text-gray-500">{req.department}</td>
                      <td className="p-8 text-[12px] font-black text-[#A67C52]">{req.currency} {req.amount?.toLocaleString()}</td>
                      <td className="p-8 text-right">
                        <span className={`text-[9px] font-black px-4 py-2 rounded-full ${req.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {req.status === 'Approved' ? 'AUTHORIZED' : 'DECLINED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filterList(activeTab === 'queue' ? requisitions : history).length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black tracking-widest text-xs uppercase">No records found in {activeTab}</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 md:p-16 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase underline decoration-[#A67C52] decoration-8 underline-offset-8">Executive Review</h3>
                <button onClick={() => setSelectedReq(null)} className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div className="bg-gray-50 p-10 rounded-[3rem]">
                   <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">Justification</p>
                   <p className="text-sm font-bold text-gray-700 italic leading-relaxed">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                   <div className="mt-8 pt-8 border-t border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest italic">Finance Vetting Note</p>
                      <p className="text-xs font-black text-black">"{selectedReq.fcComment || "Vetted for accuracy and budget alignment."}"</p>
                   </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between border-b-2 border-gray-50 pb-4">
                    <span className="text-[10px] font-black text-gray-400">STAFF / DEPT</span>
                    <span className="text-xs font-black text-gray-900">{selectedReq.requesterName} ({selectedReq.department})</span>
                  </div>
                  <div className="flex justify-between border-b-2 border-gray-50 pb-4">
                    <span className="text-[10px] font-black text-gray-400">TOTAL VALUE</span>
                    <span className="text-3xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</span>
                  </div>
                  {selectedReq.attachment && (
                    <a href={selectedReq.attachment} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-4 bg-black text-white w-full py-6 rounded-[2rem] text-[11px] font-black tracking-widest hover:bg-[#A67C52] transition-all">
                      📎 VIEW SUPPORTING DOCUMENTS
                    </a>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-10">
                <textarea 
                  value={mdComment}
                  onChange={(e) => setMdComment(e.target.value)}
                  placeholder="Final executive directives..."
                  className="w-full h-32 bg-gray-50 border-4 border-transparent rounded-[2.5rem] p-8 text-sm font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-8 shadow-inner"
                />
                <div className="flex flex-col md:flex-row gap-6">
                  <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-black text-[#A67C52] py-6 rounded-full text-[12px] font-black tracking-widest hover:scale-105 transition-all">AUTHORIZE PAYMENT</button>
                  <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-white border-2 border-red-100 text-red-400 py-6 rounded-full text-[12px] font-black tracking-widest hover:bg-red-50">DECLINE REQUEST</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MDDashboard;
