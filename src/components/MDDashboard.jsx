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
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      // Dual-stream fetch: Final Pending vs Authorized History
      const [queueRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/MD`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history/MD`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRequisitions(queueRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      toast.error("Executive data sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filterList = (list) => list.filter(req => 
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (id, action) => {
    const loadingToast = toast.loading(`Executing Final ${action}...`);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'MD',
        actorName: user.name,
        comment: mdComment || (action === 'Approved' ? 'Final authorization granted. Proceed to payment.' : 'Declined by MD')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Request ${action} successfully`, { id: loadingToast });
      setSelectedReq(null);
      setMdComment('');
      fetchData(); 
    } catch (err) {
      toast.error("Execution failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-black rounded-full mb-4"></div>
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">Executive Portal Syncing...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVIGATION */}
      <nav className="bg-black text-white px-8 py-6 flex justify-between items-center sticky top-0 z-50 border-b border-[#A67C52]/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-full flex items-center justify-center font-black text-lg shadow-lg">MD</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Executive Authority</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Bricks Mursten Mattoni</p>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[10px] font-black border-2 border-[#A67C52] px-6 py-2 rounded-full hover:bg-[#A67C52] transition-all">SIGN OUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* EXECUTIVE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 mt-6">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">DIRECTOR'S <span className="text-[#A67C52]">OVERSIGHT</span></h2>
            <div className="flex gap-8 mt-8">
              <button onClick={() => setActiveTab('queue')} className={`text-[10px] font-black tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'queue' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
                FINAL APPROVALS ({requisitions.length})
              </button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'history' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}>
                PAYMENT HISTORY ({history.length})
              </button>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="FILTER BY DEPT, STAFF, OR VENDOR..." 
              className="bg-white border-2 border-gray-100 rounded-full px-8 py-4 text-[10px] font-bold flex-1 md:w-96 outline-none focus:border-black shadow-xl"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* DATA STREAM */}
        <div className="grid gap-6">
          {activeTab === 'queue' ? (
            filterList(requisitions).map(req => (
              <div key={req._id} className="bg-white rounded-[3rem] border-l-[12px] border-l-[#A67C52] p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm hover:shadow-2xl transition-all">
                <div className="flex items-center gap-8 flex-1">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 mb-1">{req.currency}</p>
                    <p className="text-2xl font-black text-gray-900 leading-none">{req.amount?.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-[1px] bg-gray-100"></div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-black text-[#A67C52] text-[8px] font-black px-2 py-1 rounded tracking-widest uppercase">{req.department}</span>
                      <span className="text-[9px] font-bold text-gray-400 tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 leading-none">{req.requesterName}</h3>
                    <p className="text-[10px] font-bold text-[#A67C52] mt-1">{req.vendorName || "General Requisition"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReq(req)}
                  className="w-full md:w-auto bg-black text-white px-12 py-5 rounded-full text-[10px] font-black tracking-[0.3em] hover:bg-[#A67C52] transition-all shadow-xl"
                >
                  AUTHORIZE
                </button>
              </div>
            ))
          ) : (
            /* HISTORY TABLE */
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-8 text-[10px] font-black text-gray-400">STAFF</th>
                    <th className="p-8 text-[10px] font-black text-gray-400">VALUE</th>
                    <th className="p-8 text-[10px] font-black text-gray-400">DEPT</th>
                    <th className="p-8 text-[10px] font-black text-gray-400 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(history).map(req => (
                    <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-8">
                        <p className="text-[11px] font-black text-gray-900 leading-none mb-1">{req.requesterName}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{new Date(req.updatedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-8 text-[12px] font-black text-[#A67C52]">{req.currency} {req.amount?.toLocaleString()}</td>
                      <td className="p-8 text-[10px] font-bold text-gray-500 uppercase">{req.department}</td>
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
        </div>
      </main>

      {/* AUTHORIZATION MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 md:p-16 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase border-b-8 border-[#A67C52] inline-block mb-4">Executive Review</h3>
                  <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-gray-400 tracking-widest">HOD APPROVED ✅</span>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest">FINANCE VETTED ✅</span>
                  </div>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all shadow-lg">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div className="space-y-8">
                  <div className="bg-gray-50 p-8 rounded-[2rem]">
                    <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Requisition Narrative</p>
                    <p className="text-sm font-bold text-gray-700 italic leading-relaxed">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                  </div>
                  
                  <div className="bg-black text-white p-8 rounded-[2rem]">
                    <p className="text-[10px] font-black text-[#A67C52] mb-4 uppercase tracking-[0.2em]">Vetting Remarks (FC)</p>
                    <p className="text-sm font-bold italic">"{selectedReq.fcComment || "No vetting notes provided."}"</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-end border-b-2 border-gray-100 pb-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">Vendor / Payee</p>
                      <p className="text-lg font-black text-gray-900">{selectedReq.vendorName || "Internal Requisition"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">Final Amount</p>
                      <p className="text-3xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-gray-400 mb-4 uppercase italic">Supporting Evidence</p>
                    {selectedReq.attachment ? (
                      <a href={selectedReq.attachment} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-4 bg-gray-100 text-black w-full py-6 rounded-[2rem] text-[11px] font-black tracking-widest hover:bg-black hover:text-white transition-all shadow-xl">
                        📎 OPEN ATTACHED PDF/IMAGE
                      </a>
                    ) : (
                      <div className="bg-red-50 text-red-500 p-6 rounded-[2rem] text-center border-2 border-dashed border-red-200">
                        <p className="text-[10px] font-black">WARNING: NO SUPPORTING DOCUMENTS</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-gray-50 pt-12">
                <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest italic text-center">Final Directive (Optional)</p>
                <textarea 
                  value={mdComment}
                  onChange={(e) => setMdComment(e.target.value)}
                  placeholder="Additional instructions for accounts department..."
                  className="w-full h-32 bg-gray-50 border-4 border-transparent rounded-[2.5rem] p-8 text-sm font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-8 shadow-inner"
                />
                
                <div className="flex flex-col md:flex-row gap-6">
                  <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-black text-[#A67C52] py-6 rounded-full text-[12px] font-black tracking-[0.4em] shadow-2xl hover:scale-105 transition-all">
                    AUTHORIZE PAYMENT
                  </button>
                  <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-white border-4 border-red-50 text-red-400 py-6 rounded-full text-[12px] font-black tracking-[0.4em] hover:bg-red-50 transition-all">
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

export default MDDashboard;
