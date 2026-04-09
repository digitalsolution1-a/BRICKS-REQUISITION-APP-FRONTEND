import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';

const Dashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'Staff', dept: 'N/A' };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      // Fetching pending items for the user role
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/${user.role}`, config);
      
      let displayData = res.data;

      /**
       * MD SPECIFIC VIEW LOGIC:
       * Filters the list so the MD only sees items at the 'MD' stage 
       * OR items currently pending with the 'FC' for override capability.
       */
      if (user.role === 'MD') {
        displayData = res.data.filter(req => 
          req.currentStage === 'MD' || req.currentStage === 'FC'
        );
      }

      setRequisitions(displayData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleDownload = (fullUrl) => {
    if (!fullUrl) return alert("No document attached.");
    window.open(fullUrl, '_blank');
  };

  const handleAction = async (id, action) => {
    const targetReq = requisitions.find(r => r._id === id);
    
    // Logic flags for special prompts
    const isSuperAdmin = user.role === 'Admin' && action === 'Approved';
    const isMDOverride = user.role === 'MD' && targetReq?.currentStage === 'FC' && action === 'Approved';
    const isStandardMD = user.role === 'MD' && targetReq?.currentStage === 'MD' && action === 'Approved';
    
    let promptMessage = `Enter comment for ${action}:`;
    
    if (isSuperAdmin) {
      promptMessage = "🚀 SUPER ADMIN OVERRIDE: Provide reason to force PAID status:";
    } else if (isMDOverride) {
      promptMessage = "⚠️ MD OVERRIDE (FC BYPASS): Provide reason for fast-tracking this request:";
    } else if (isStandardMD) {
      promptMessage = "🖋️ MD INSTRUCTIONS: Enter final payment instructions for the Accountant:";
    }

    const comment = prompt(promptMessage);
    if (comment === null) return; 

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment,
        actorRole: user.role,
        actorName: user.name,
        // Backend uses this flag to skip the FC stage if MD approves an FC item
        isOverride: isMDOverride || isSuperAdmin 
      }, config);
      
      if (window.Notification && Notification.permission === "granted") {
        new Notification("BRICKS Fleet Update", {
          body: `Requisition processed: ${action}`,
          icon: "/logo192.png"
        });
      }

      alert(isMDOverride ? "FC Bypass Successful: Sent to Accountant." : `Action processed successfully`);
      setSelectedReq(null);
      fetchPendingRequests(); 
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.error || "Server error"));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-[#A67C52] text-4xl font-black tracking-tight uppercase">
              {user.role === 'Accountant' ? 'Disbursement Queue' : 
               user.role === 'MD' ? 'Executive Review' : 'Pending Approval'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 bg-[#A67C52] rounded-full animate-pulse"></span>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                {user.role} Control — BRICKS Fleet Management
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user.role === 'Admin' && (
              <button 
                onClick={() => navigate('/admin/users')}
                className="hidden md:block text-[10px] font-black text-[#A67C52] hover:text-[#8b6542] uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-lg transition-colors"
              >
                User Management
              </button>
            )}
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="text-right">
                <p className="font-black text-gray-800 text-xs leading-tight">{user.name}</p>
                <div className="flex gap-2 justify-end">
                   <button onClick={() => navigate('/profile')} className="text-[9px] text-gray-400 font-bold hover:text-[#A67C52] uppercase tracking-tighter">Profile</button>
                   <span className="text-gray-200 text-[9px]">•</span>
                   <button onClick={handleLogout} className="text-[9px] text-red-500 font-bold hover:text-red-700 uppercase tracking-tighter">Sign Out</button>
                </div>
              </div>
              <div className="h-10 w-10 bg-[#A67C52] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-900/20">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-orange-100 border-t-[#A67C52] rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Syncing Fleet Pipeline...</p>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white p-20 rounded-[2rem] text-center border border-dashed border-gray-200">
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No requisitions currently awaiting your action.</p>
          </div>
        ) : (
          <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                    <th className="p-8">Requester</th>
                    <th className="p-8">Vendor / Narrative</th>
                    <th className="p-8 text-right">Valuation</th>
                    <th className="p-8 text-center">Status/Stage</th>
                    <th className="p-8 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requisitions.map((req) => (
                    <tr key={req._id} className="hover:bg-orange-50/20 transition-all group">
                      <td className="p-8">
                        <p className="font-black text-gray-800">{req.requesterName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{req.department}</p>
                      </td>
                      <td className="p-8">
                        <p className="text-sm font-bold text-gray-600">{req.vendorName}</p>
                        <button 
                          onClick={() => setSelectedReq(req)} 
                          className="text-[9px] font-black text-[#A67C52] underline uppercase tracking-widest mt-1 hover:text-[#8b6542]"
                        >
                          View Full Brief
                        </button>
                      </td>
                      <td className="p-8 text-right">
                        <p className="font-black text-[#A67C52] text-xl tracking-tighter">
                          <span className="text-[10px] mr-1 opacity-50">{req.currency}</span>
                          {req.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border ${
                          req.currentStage === 'FC' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-[#A67C52] border-orange-100'
                        }`}>
                          {req.currentStage} {req.currentStage === 'FC' && user.role === 'MD' ? '(Override Available)' : ''}
                        </span>
                      </td>
                      <td className="p-8 text-center">
                        <button 
                          onClick={() => setSelectedReq(req)}
                          className={`text-[10px] font-black px-6 py-3 rounded-xl shadow-lg transition-all uppercase tracking-widest ${
                            req.currentStage === 'FC' && user.role === 'MD' 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-[#A67C52] text-white hover:bg-black'
                          }`}
                        >
                          {user.role === 'Accountant' ? 'Pay' : req.currentStage === 'FC' && user.role === 'MD' ? 'Override' : 'Process'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Overlay */}
        {selectedReq && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <button onClick={() => setSelectedReq(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black font-black text-xl">✕</button>

              <div className="p-10 md:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-black text-[#A67C52] uppercase tracking-tighter">Requisition Brief</h2>
                      <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Ref: {selectedReq._id}</p>
                    </div>

                    {user.role === 'Accountant' && selectedReq.mdInstructions && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-2xl">
                         <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">MD Final Instructions</p>
                         <p className="text-blue-900 font-bold italic text-sm">"{selectedReq.mdInstructions}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Valuation</p>
                        <p className="text-xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Settlement Date</p>
                        <p className="text-sm font-bold text-gray-800">{new Date(selectedReq.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="bg-[#A67C52] p-6 rounded-3xl text-white flex items-center justify-between shadow-xl">
                      <div className="flex-1 mr-4">
                        <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">Attachment</p>
                        <p className="text-sm font-bold truncate">{selectedReq.attachmentName || "Supporting Document"}</p>
                      </div>
                      <button 
                        onClick={() => handleDownload(selectedReq.attachmentUrl)}
                        className="bg-white text-[#A67C52] px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-orange-50 transition-all"
                      >
                        📂 Open Cloud File
                      </button>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-gray-50">
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Approved')}
                        className={`flex-1 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${
                           selectedReq.currentStage === 'FC' && user.role === 'MD' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {selectedReq.currentStage === 'FC' && user.role === 'MD' ? 'Bypass FC & Approve' : 
                         user.role === 'Accountant' ? 'Confirm Payment' : 'Approve'}
                      </button>
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Declined')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                    <AuditTimeline history={selectedReq.approvalHistory} />
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
