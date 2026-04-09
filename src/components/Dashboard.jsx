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
      // Fetches all requisitions so the MD can see both their queue and the FC's queue
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending`, config);
      setRequisitions(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!actionComment.trim()) return alert("Audit comment is required for executive actions.");
    
    const isMDOverride = user.role === 'MD' && selectedReq?.currentStage === 'FC';
    
    if (isMDOverride && action === 'Approved') {
      const confirm = window.confirm("ATTENTION: You are performing an FC Override. This will be recorded in the permanent audit trail. Continue?");
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

      alert(isMDOverride ? "FC Stage Bypassed successfully." : "Action completed.");
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Action failed"));
    }
  };

  // Filter Logic for MD oversight
  const mdPrimaryQueue = requisitions.filter(r => r.currentStage === 'MD');
  const fcPendingQueue = requisitions.filter(r => r.currentStage === 'FC');

  const renderTable = (data, title, accentColor, buttonLabel, isOverride = false) => (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${accentColor} shadow-sm`}></span> {title}
        </h3>
        <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
          {data.length} Pending
        </span>
      </div>
      <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
              <th className="p-8">Originator</th>
              <th className="p-8">Vendor / Description</th>
              <th className="p-8 text-right">Value</th>
              <th className="p-8 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((req) => (
              <tr key={req._id} className="hover:bg-gray-50/50 transition-all">
                <td className="p-8">
                  <p className="font-black text-gray-800 text-sm">{req.requesterName}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{req.department}</p>
                </td>
                <td className="p-8 text-sm font-bold text-gray-600">{req.vendorName}</td>
                <td className="p-8 text-right font-black text-[#A67C52] text-lg">
                  <span className="text-[10px] mr-1 opacity-40">{req.currency}</span>
                  {req.amount.toLocaleString()}
                </td>
                <td className="p-8 text-center">
                  <button 
                    onClick={() => setSelectedReq(req)} 
                    className={`text-[10px] font-black px-7 py-3 rounded-xl uppercase tracking-widest transition-all hover:scale-105 text-white shadow-md ${isOverride ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#A67C52] hover:bg-black'}`}
                  >
                    {isOverride ? 'Override FC' : buttonLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-16 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">Queue is clear</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Account Profile */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
              {user.role === 'MD' ? 'Executive Command' : 'Dashboard'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-2">Bricks Mursten Mattoni Fleet</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                {/* STRICT ROLE CHECK: MD sees Analytics, Admin sees Manage Users */}
                {user.role === 'Admin' ? (
                  <button onClick={() => navigate('/admin/users')} className="text-[9px] font-black text-white bg-red-600 px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-lg shadow-red-900/10">Manage Users</button>
                ) : user.role === 'MD' ? (
                  <button onClick={() => navigate('/reports')} className="text-[9px] font-black text-[#A67C52] bg-orange-50 px-5 py-2.5 rounded-xl uppercase tracking-widest border border-orange-100">System Analytics</button>
                ) : null}
            </div>

            {/* Account Profile Section */}
            <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="text-right">
                <p className="font-black text-gray-800 text-xs leading-tight">{user.name}</p>
                <div className="flex gap-2 justify-end mt-0.5">
                   <button onClick={() => navigate('/profile')} className="text-[9px] text-gray-400 font-bold hover:text-[#A67C52] uppercase tracking-tighter">Profile</button>
                   <span className="text-gray-200 text-[9px]">•</span>
                   <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[9px] text-red-500 font-bold hover:text-red-700 uppercase tracking-tighter">Sign Out</button>
                </div>
              </div>
              <div className="h-10 w-10 bg-[#A67C52] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-900/20">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest animate-pulse">Syncing Encrypted Ledger...</div>
        ) : (
          <>
            {user.role === 'MD' ? (
              <>
                {/* Log 1: Direct Approvals */}
                {renderTable(mdPrimaryQueue, "Items Pending Your Approval", "bg-green-500", "Review & Sign")}
                
                {/* Log 2: FC Override Log */}
                {renderTable(fcPendingQueue, "FC Pending Approvals (Oversight Log)", "bg-blue-600", "Override FC", true)}
              </>
            ) : (
              renderTable(requisitions, "Standard Action Queue", "bg-[#A67C52]", "Review File")
            )}
          </>
        )}

        {/* Action Modal */}
        {selectedReq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl relative overflow-hidden border border-white/10">
              <div className="p-10 md:p-16">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block ${selectedReq.currentStage === 'FC' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-[#A67C52]'}`}>
                      {selectedReq.currentStage === 'FC' ? 'OVERRIDE MODE' : 'STANDARD APPROVAL'}
                    </span>
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">{selectedReq.vendorName}</h2>
                  </div>
                  <button onClick={() => { setSelectedReq(null); setActionComment(""); }} className="text-gray-300 hover:text-black transition-colors text-2xl font-black">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Executive Comment / Justification</p>
                      <textarea 
                        className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-orange-100 focus:border-[#A67C52] transition-all outline-none resize-none"
                        rows="4"
                        placeholder={selectedReq.currentStage === 'FC' ? "Provide reason for bypassing Financial Controller..." : "Enter payment instructions..."}
                        value={actionComment}
                        onChange={(e) => setActionComment(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Approved')}
                        className={`flex-1 py-5 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all ${selectedReq.currentStage === 'FC' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'}`}
                      >
                        {selectedReq.currentStage === 'FC' ? 'Authorize Override' : 'Confirm Sign-off'}
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
                    <div className="bg-[#A67C52] p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-orange-900/20">
                        <div>
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Total Valuation</p>
                            <p className="text-3xl font-black tracking-tighter">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
                        </div>
                        <button onClick={() => window.open(selectedReq.attachmentUrl, '_blank')} className="bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/30 transition-all">📂</button>
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
