import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const MDDashboard = () => {
  const [inbox, setInbox] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending or history
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [mdComment, setMdComment] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mdRes, fcRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/MD`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/pending/FC`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history/MD`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setInbox(mdRes.data);
      setBacklog(fcRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Filtering Logic
  const filterList = (list) => list.filter(req => 
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const dataToExport = activeTab === 'pending' ? [...inbox, ...backlog] : history;
    const headers = "ID,Date,Requester,Dept,Amount,Status\n";
    const csv = dataToExport.map(r => `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.department},${r.amount},${r.status}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MD_Report_${activeTab}.csv`;
    a.click();
  };

  const handleAction = async (id, action, isOverride = false) => {
    if (!mdComment && action === 'Declined') return toast.error("Please provide a reason.");
    
    const loadingToast = toast.loading('Synchronizing...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'MD',
        actorName: 'Emmanuel Maiguwa',
        comment: mdComment || (action === 'Approved' ? 'Final approval granted. Proceed with payment.' : ''),
        isOverride
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(action === 'Approved' ? "Authorized" : "Declined", { id: loadingToast });
      setSelectedReq(null);
      setMdComment('');
      fetchData();
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
    <div className="min-h-screen bg-[#FBFBFB] uppercase">
      {/* CORPORATE NAV */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Executive</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Managing Director Portal</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-xl hover:bg-red-600 transition-all">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">Executive <span className="text-[#A67C52]">Control</span></h2>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setActiveTab('pending')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 ${activeTab === 'pending' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>PENDING QUEUE</button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>APPROVAL HISTORY</button>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="text" placeholder="Search records..." className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-[#A67C52]" onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={exportToExcel} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black">EXPORT</button>
          </div>
        </div>

        {activeTab === 'pending' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* INBOX */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-[#A67C52] tracking-[0.3em] mb-4">Direct Action (Vetted)</h3>
              {filterList(inbox).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-black text-gray-400">{req.department}</p>
                    <h4 className="font-black text-gray-800">{req.requesterName}</h4>
                    <p className="text-lg font-black text-[#A67C52] leading-none mt-1">{req.currency} {req.amount.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">PROCESS</button>
                </div>
              ))}
            </section>

            {/* OVERRIDE */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-red-500 tracking-[0.3em] mb-4">FC Oversight (Override)</h3>
              {filterList(backlog).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2rem] border-l-4 border-l-red-500 border-gray-100 shadow-sm flex justify-between items-center opacity-80 hover:opacity-100">
                  <div>
                    <h4 className="font-black text-gray-800">{req.requesterName}</h4>
                    <p className="text-xs font-bold text-red-500 italic mt-1">Awaiting FC Vetting</p>
                  </div>
                  <button onClick={() => { setSelectedReq({ ...req, isOverride: true }) }} className="bg-red-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest">OVERRIDE</button>
                </div>
              ))}
            </section>
          </div>
        ) : (
          /* HISTORY VIEW */
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black text-gray-400">DATE</th>
                  <th className="p-6 text-[10px] font-black text-gray-400">STAFF</th>
                  <th className="p-6 text-[10px] font-black text-gray-400">AMOUNT</th>
                  <th className="p-6 text-[10px] font-black text-gray-400">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filterList(history).map(req => (
                  <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-6 text-[10px] font-bold text-gray-600">{new Date(req.updatedAt).toLocaleDateString()}</td>
                    <td className="p-6 text-[10px] font-black text-gray-800">{req.requesterName}</td>
                    <td className="p-6 text-[10px] font-black text-[#A67C52]">{req.currency} {req.amount.toLocaleString()}</td>
                    <td className="p-6">
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full ${req.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* --- MD ACTION MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{selectedReq.isOverride ? 'Executive Override' : 'Final Authorization'}</h3>
                  <p className="text-[10px] font-bold text-[#A67C52] mt-2">DEPT: {selectedReq.department}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black">✕</button>
              </div>

              <div className="space-y-6 mb-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-3xl">
                    <p className="text-[9px] font-black text-gray-400 mb-1 uppercase">Request Amount</p>
                    <p className="text-2xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl">
                    <p className="text-[9px] font-black text-gray-400 mb-1 uppercase">Vendor / Purpose</p>
                    <p className="text-xs font-black text-gray-800">{selectedReq.vendorName || "General"}</p>
                  </div>
                </div>

                {/* FC COMMENTS REVEAL */}
                {!selectedReq.isOverride && (
                  <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600 mb-2 uppercase italic tracking-widest">FC Vetting Remark</p>
                    <p className="text-[11px] font-bold text-gray-600 italic leading-relaxed">"{selectedReq.fcComment || "No specific instructions from FC."}"</p>
                  </div>
                )}

                <div className="bg-[#FBF9F6] p-6 rounded-3xl border border-gray-100 italic">
                  <p className="text-[9px] font-black text-gray-300 mb-2 uppercase tracking-widest">Request Description</p>
                  <p className="text-[11px] font-bold text-gray-600">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>

                {selectedReq.attachment && (
                  <a href={selectedReq.attachment} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 bg-gray-900 text-[#A67C52] w-full py-5 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl">
                    📎 VIEW SUPPORTING DOCUMENT
                  </a>
                )}
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">Instruction to Account Dept.</p>
                <textarea 
                  value={mdComment} 
                  onChange={(e) => setMdComment(e.target.value)} 
                  placeholder={selectedReq.isOverride ? "Provide reason for FC bypass..." : "e.g., Pay in installments, treat as urgent, or verify bank details..."}
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2rem] p-5 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => handleAction(selectedReq._id, 'Approved', selectedReq.isOverride)} className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                    AUTHORIZE PAYMENT
                  </button>
                  <button onClick={() => handleAction(selectedReq._id, 'Declined', selectedReq.isOverride)} className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all">
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

export default MDDashboard;
