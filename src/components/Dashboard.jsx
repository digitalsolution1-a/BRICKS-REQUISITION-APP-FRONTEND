import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';

const Dashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionComment, setActionComment] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff' };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      // Fetching all pending requisitions to allow for cross-stage oversight
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending`, config);
      setRequisitions(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!actionComment.trim()) return alert("Please enter a comment or instruction.");
    
    const isMDOverride = user.role === 'MD' && selectedReq?.currentStage === 'FC';
    
    // Safety confirmation for oversight actions
    if (isMDOverride && action === 'Approved') {
      const confirm = window.confirm("You are approving this on behalf of the Financial Controller. Proceed with bypass?");
      if (!confirm) return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment: actionComment,
        actorRole: user.role,
        actorName: user.name,
        isOverride: isMDOverride || user.role === 'Admin'
      }, config);

      alert(isMDOverride ? "FC Stage Bypassed successfully." : "Action processed.");
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Action failed"));
    }
  };

  // Logic: Segmenting data for the MD view
  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  const mdFCOversight = requisitions.filter(r => r.currentStage === 'FC');

  const renderTable = (data, title, accentColor, buttonLabel, isOverride = false) => (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${accentColor}`}></span> {title}
        </h3>
        <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          {data.length} Items
        </span>
      </div>
      <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
              <th className="p-8">Originator</th>
              <th className="p-8">Vendor</th>
              <th className="p-8 text-right">Amount</th>
              <th className="p-8 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((req) => (
              <tr key={req._id} className="hover:bg-gray-50/50 transition-all">
                <td className="p-8">
                  <p className="font-black text-gray-800 text-sm">{req.requesterName}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{req.department}</p>
                </td>
                <td className="p-8 text-sm font-bold text-gray-600">{req.vendorName}</td>
                <td className="p-8 text-right font-black text-[#A67C52] text-lg">
                  <span className="text-[10px] mr-1 opacity-40">{req.currency}</span>
                  {req.amount.toLocaleString()}
                </td>
                <td className="p-8 text-center">
                  <button 
                    onClick={() => setSelectedReq(req)} 
                    className={`text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest shadow-md transition-all hover:scale-105 text-white ${isOverride ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#A67C52] hover:bg-black'}`}
                  >
                    {buttonLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-16 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">Queue Clear</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
              {user.role === 'MD' ? 'Executive Desk' : 'Management Portal'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Bricks Mursten Mattoni</p>
          </div>

          <div className="flex items-center gap-4">
            {user.role === 'Admin' && (
              <button onClick={() => navigate('/admin/users')} className="text-[10px] font-black text-white bg-red-600 px-6 py-3 rounded-2xl uppercase tracking-widest">
                Manage Users
              </button>
            )}
            {user.role === 'MD' && (
              <button onClick={() => navigate('/reports')} className="text-[10px] font-black text-[#A67C52] bg-orange-50 px-6 py-3 rounded-2xl uppercase tracking-widest border border-orange-100">
                System Analytics
              </button>
            )}
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="h-12 w-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-sm text-red-500 hover:bg-red-50 transition-colors font-black">✕</button>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center animate-pulse text-[10px] font-black text-gray-300 uppercase tracking-widest">Syncing Fleet Ledger...</div>
        ) : (
          <>
            {user.role === 'MD' ? (
              <>
                {renderTable(mdPrimaryQueue, "Standard MD Approvals", "bg-green-500", "Final Sign-off")}
                {renderTable(mdFCOversight, "FC Pending (Override Available)", "bg-blue-500", "Execute Bypass", true)}
              </>
            ) : (
              renderTable(requisitions, "Pending Tasks", "bg-[#A67C52]", "Review Requisition")
            )}
          </>
        )}

        {/* Action Modal */}
        {selectedReq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl relative overflow-hidden">
              <div className="p-10 md:p-16">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="bg-orange-50 text-[#A67C52] text-[9px] font-black px-4 py-1.5 rounded-full uppercase mb-3 inline-block">
                      Req Code: {selectedReq._id.slice(-6)}
                    </span>
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">{selectedReq.vendorName}</h2>
                  </div>
                  <button onClick={() => { setSelectedReq(null); setActionComment(""); }} className="text-gray-300 hover:text-black transition-colors text-2xl font-black">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Executive Comments</p>
                      <textarea 
                        className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-orange-100 focus:border-[#A67C52] transition-all outline-none resize-none"
                        rows="5"
                        placeholder="Add instructions or reason for override..."
                        value={actionComment}
                        onChange={(e) => setActionComment(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Approved')}
                        className={`flex-1 py-5 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl ${selectedReq.currentStage === 'FC' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {selectedReq.currentStage === 'FC' ? 'Authorize Bypass' : 'Confirm Approval'}
                      </button>
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Declined')}
                        className="flex-1 py-5 rounded-2xl bg-red-50 text-red-600 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-100 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#A67C52] p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl">
                        <div>
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-3xl font-black tracking-tighter">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
                        </div>
                        <button onClick={() => window.open(selectedReq.attachmentUrl, '_blank')} className="bg-white/10 p-4 rounded-2xl border border-white/20">📂</button>
                    </div>
                    <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 max-h-[300px] overflow-y-auto">
                      <AuditTimeline history={selectedReq.approvalHistory} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
