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
  }, [user.role]);

  const fetchPendingRequests = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/${user.role}`, config);
      setRequisitions(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    // Basic validation: approval/decline should have context
    if (!actionComment.trim()) {
      return alert("Please provide instructions or comments before processing.");
    }
    
    const isMDOverride = user.role === 'MD' && selectedReq?.currentStage === 'FC';
    const isSuperAdmin = user.role === 'Admin';

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment: actionComment,
        actorRole: user.role,
        actorName: user.name,
        isOverride: isMDOverride || isSuperAdmin 
      }, config);

      alert(isMDOverride ? "FC Bypass Successful: Sent to Accounts." : "Action processed successfully.");
      setSelectedReq(null);
      setActionComment("");
      fetchPendingRequests();
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Server communication failed"));
    }
  };

  // Logic to separate MD views into distinct queues
  const mdPersonalQueue = requisitions.filter(r => r.currentStage === 'MD');
  const mdFCOversight = requisitions.filter(r => r.currentStage === 'FC');

  const renderTable = (data, title, accentColor = "bg-[#A67C52]") => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className={`h-4 w-1 rounded-full ${accentColor}`}></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
          {title} ({data.length})
        </h3>
      </div>
      <div className="bg-white shadow-xl rounded-[2rem] overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                <th className="p-8">Requester</th>
                <th className="p-8">Vendor / Description</th>
                <th className="p-8 text-right">Valuation</th>
                <th className="p-8 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((req) => (
                <tr key={req._id} className="hover:bg-orange-50/20 transition-all">
                  <td className="p-8">
                    <p className="font-black text-gray-800">{req.requesterName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{req.department}</p>
                  </td>
                  <td className="p-8">
                    <p className="text-sm font-bold text-gray-600">{req.vendorName}</p>
                  </td>
                  <td className="p-8 text-right">
                    <p className="font-black text-[#A67C52] text-lg">
                      <span className="text-[10px] mr-1 opacity-50">{req.currency}</span>
                      {req.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="p-8 text-center">
                    <button 
                      onClick={() => setSelectedReq(req)} 
                      className={`text-[10px] font-black px-6 py-2 rounded-xl uppercase tracking-widest transition-all ${
                        req.currentStage === 'FC' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#A67C52] text-white hover:bg-black'
                      }`}
                    >
                      {req.currentStage === 'FC' ? 'Review & Override' : 'Process Request'}
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">
                    No items in this queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-gray-900 text-4xl font-black tracking-tight uppercase">
              {user.role === 'MD' ? 'Executive Dashboard' : 'Digital Approvals'}
            </h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
              BRICKS MURSTEN MATTONI
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* STRICT ADMIN CHECK: Hidden from MD */}
            {user.role === 'Admin' && (
              <button 
                onClick={() => navigate('/admin/users')}
                className="text-[10px] font-black text-white bg-red-600 px-6 py-3 rounded-2xl uppercase tracking-widest shadow-lg shadow-red-900/20 hover:scale-105 transition-transform"
              >
                User Management
              </button>
            )}
            
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="h-10 w-10 bg-[#A67C52] rounded-2xl flex items-center justify-center text-white font-black text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="text-right">
                <p className="font-black text-gray-800 text-xs leading-none mb-1">{user.name}</p>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[9px] text-red-500 font-black uppercase tracking-tighter hover:underline">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-40 text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-100 border-t-[#A67C52] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Securing Ledger Connection...</p>
          </div>
        ) : (
          <>
            {user.role === 'MD' ? (
              <>
                {renderTable(mdPersonalQueue, "Immediate Executive Action Required", "bg-green-500")}
                {renderTable(mdFCOversight, "Financial Controller Oversight (FC Backlog)", "bg-blue-600")}
              </>
            ) : (
              renderTable(requisitions, "Pending Approvals")
            )}
          </>
        )}

        {/* Modal Overlay with Inline Comment Box */}
        {selectedReq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <button 
                onClick={() => { setSelectedReq(null); setActionComment(""); }} 
                className="absolute top-8 right-8 text-gray-300 hover:text-black font-black text-xl transition-colors"
              >
                ✕
              </button>

              <div className="p-8 md:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  
                  <div className="space-y-8">
                    <div>
                      <span className="bg-orange-50 text-[#A67C52] text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">
                        Maritime Requisition #{selectedReq._id.slice(-6)}
                      </span>
                      <h2 className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tighter">
                        {selectedReq.vendorName}
                      </h2>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        Approval Instructions / Comments
                      </p>
                      <textarea 
                        className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-[#A67C52] transition-all outline-none resize-none"
                        rows="5"
                        placeholder={selectedReq.currentStage === 'FC' ? "Provide reason for FC Bypass..." : "Enter payment instructions for Accountant..."}
                        value={actionComment}
                        onChange={(e) => setActionComment(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Approved')}
                        className={`flex-1 py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${
                          selectedReq.currentStage === 'FC' ? 'bg-blue-600 shadow-blue-900/20' : 'bg-green-600 shadow-green-900/20'
                        }`}
                      >
                        {selectedReq.currentStage === 'FC' ? 'Execute Override' : 'Confirm Approval'}
                      </button>
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Declined')}
                        className="flex-1 py-5 rounded-2xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-100 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#A67C52] p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-orange-900/20">
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Total Valuation</p>
                        <p className="text-3xl font-black tracking-tighter">
                          {selectedReq.currency} {selectedReq.amount.toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => window.open(selectedReq.attachmentUrl, '_blank')}
                        className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all border border-white/20"
                      >
                        📂
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 h-[350px] overflow-y-auto">
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
