import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
  const [selectedReq, setSelectedReq] = useState(null); 
  const [fcComment, setFcComment] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Fetch Pending Queue (Critical)
      try {
        const queueRes = await axios.get(`${API_BASE_URL}/requisitions/pending/FC`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      } catch (qErr) {
        console.error("Queue Sync Error:", qErr);
        toast.error("Failed to sync current vetting queue");
      }

      // 2. Fetch History (Optional - won't crash the dashboard if endpoint is missing)
      try {
        const historyRes = await axios.get(`${API_BASE_URL}/requisitions/history/FC`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch (hErr) {
        console.warn("History endpoint not reachable yet.");
        setHistory([]); // Default to empty if backend isn't ready
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const exportToExcel = () => {
    const dataToExport = activeTab === 'queue' ? filterList(requisitions) : filterList(history);
    if (dataToExport.length === 0) return toast.error("No data to export");

    const headers = "ID,Date,Requester,Department,Vendor,Amount,Currency,Status,Vetting_Note\n";
    const data = dataToExport.map(r => 
      `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.department},${r.vendorName || 'N/A'},${r.amount},${r.currency},${r.status},"${r.fcComment || ''}"`
    ).join("\n");
    
    const blob = new Blob([headers + data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FC_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAction = async (id, action) => {
    if (!fcComment && action === 'Declined') {
      return toast.error("Please provide instructions/reason for decline");
    }

    const loadingToast = toast.loading('Synchronizing vetting results...');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'FC',
        actorName: user?.name || 'Financial Controller',
        comment: fcComment || (action === 'Approved' ? 'Vetted and cleared for MD' : 'Declined at FC stage')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Request ${action === 'Approved' ? 'Forwarded' : 'Declined'} successfully`, { id: loadingToast });
      setSelectedReq(null);
      setFcComment('');
      fetchData(); 
    } catch (err) {
      toast.error("Action failed. Check server connection.", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-4 border-[#A67C52] border-t-transparent rounded-full mb-4"></div>
      <p className="text-[10px] font-black tracking-widest text-[#A67C52]">SYNCHRONIZING FINANCIAL PORTAL...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVIGATION */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black text-xs">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Finance</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">FC DASHBOARD</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-xl hover:bg-white hover:text-black transition-all shadow-lg">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none italic">FC <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button 
                onClick={() => setActiveTab('queue')}
                className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'queue' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
              >
                PENDING VETTING ({requisitions.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
              >
                VETTING HISTORY ({history.length})
              </button>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH BY STAFF OR DEPT..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 md:w-72 outline-none focus:border-[#A67C52] shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={exportToExcel}
              className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-[#A67C52] transition-all shadow-lg"
            >
              EXPORT CSV
            </button>
          </div>
        </div>

        {/* CONTENT VIEW */}
        <div className="grid gap-4">
          {activeTab === 'queue' ? (
            filterList(requisitions).map(req => (
              <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50">
                    <span className="text-[8px] font-black text-[#A67C52]">{req.currency}</span>
                    <span className="text-sm font-black text-gray-800">{req.amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">HOD Approved</span>
                      <span className="text-gray-400 font-bold text-[9px] tracking-widest">{req.department}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">{req.requesterName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">{req.vendorName || "General Requisition"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReq(req)}
                  className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:bg-[#A67C52] transition-all"
                >
                  VET REQUEST
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest">VETTED DATE</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest">STAFF</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest">VALUE</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 tracking-widest">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(history).map(req => (
                    <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-6 text-[10px] font-bold text-gray-500">{new Date(req.updatedAt).toLocaleDateString()}</td>
                      <td className="p-6">
                        <p className="text-[10px] font-black text-gray-900 leading-none mb-1">{req.requesterName}</p>
                        <p className="text-[8px] font-bold text-gray-400">{req.department}</p>
                      </td>
                      <td className="p-6 text-[11px] font-black text-[#A67C52]">{req.currency} {req.amount?.toLocaleString()}</td>
                      <td className="p-6">
                        <span className={`text-[8px] font-black px-3 py-1 rounded-full ${req.status === 'Approved' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {req.status === 'Approved' ? 'FORWARDED' : 'DECLINED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'queue' && filterList(requisitions).length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black tracking-[0.4em] text-xs">NO PENDING VETTING</p>
            </div>
          )}
          {activeTab === 'history' && filterList(history).length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black tracking-[0.4em] text-xs">NO VETTING HISTORY RECORDED</p>
            </div>
          )}
        </div>
      </main>

      {/* --- FC PROCESS MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">Financial Vetting</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-5 tracking-widest uppercase">Analyzing Dept: {selectedReq.department}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="border-b border-gray-50 pb-4">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Original Requester</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.requesterName}</p>
                </div>
                <div className="border-b border-gray-50 pb-4 text-right">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Requisition Value</p>
                  <p className="text-lg font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                </div>
                
                <div className="col-span-2 bg-[#FBF9F6] p-6 rounded-3xl border border-gray-100 italic shadow-inner">
                  <p className="text-[9px] font-black text-gray-300 mb-2 uppercase tracking-widest not-italic">Description of Need</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest italic">Verification Document</p>
                  {selectedReq.attachment ? (
                    <a 
                      href={selectedReq.attachment} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-4 bg-gray-900 text-[#A67C52] w-full py-5 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl"
                    >
                      📎 REVIEW SUPPORTING EVIDENCE (PDF/IMAGE)
                    </a>
                  ) : (
                    <div className="bg-red-50 border-2 border-dashed border-red-100 py-5 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-red-400">CRITICAL: NO SUPPORTING ATTACHMENT</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">FC Vetting Remark (Visible to MD)</p>
                <textarea 
                  value={fcComment}
                  onChange={(e) => setFcComment(e.target.value)}
                  placeholder="Provide brief vetting feedback for final MD approval..."
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2.5rem] p-6 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl shadow-[#A67C52]/20 hover:scale-[1.02] transition-all"
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
