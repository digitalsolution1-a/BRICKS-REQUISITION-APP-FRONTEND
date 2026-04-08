import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';

const Dashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const navigate = useNavigate();

  // Specialist Tip: Always use environment variables for your API URL
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
      // Updated to use the cloud API URL
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending`, config);
      setRequisitions(res.data);
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

  // UPDATED: Function to view cloud-hosted attachments
  const handleDownload = (fullUrl) => {
    if (!fullUrl) return alert("No document attached.");
    // Since Cloudinary provides the full HTTPS URL, we just open it directly
    window.open(fullUrl, '_blank');
  };

  const handleAction = async (id, action) => {
    const isOverride = user.role === 'Admin' && action === 'Approved';
    const promptMessage = isOverride 
      ? "🚀 SUPER ADMIN OVERRIDE: Provide a reason to fast-track this to PAID status:"
      : `Enter comment for ${action}:`;

    const comment = prompt(promptMessage);
    if (comment === null) return; 

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      
      // Updated to use the cloud API URL
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment,
        actorRole: user.role,
        actorName: user.name
      }, config);
      
      if (window.Notification && Notification.permission === "granted") {
        new Notification("BRICKS Fleet Update", {
          body: `Requisition processed: ${action}`,
          icon: "/logo192.png"
        });
      }

      alert(isOverride ? "Override successful: Status set to PAID." : `Requisition ${action} successfully`);
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
            <h1 className="text-[#A67C52] text-4xl font-black tracking-tight uppercase">Approval Gateway</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 bg-[#A67C52] rounded-full animate-pulse"></span>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                {user.role === 'Admin' ? 'System Administrator Control' : 'Fleet Operations Active'}
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

        {/* Loading / Table Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-12 h-12 border-4 border-orange-100 border-t-[#A67C52] rounded-full animate-spin"></div>
             <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Syncing BRICKS Fleet Data...</p>
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
                    <th className="p-8 text-center">Stage</th>
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
                          View Details
                        </button>
                      </td>
                      <td className="p-8 text-right">
                        <p className="font-black text-[#A67C52] text-xl tracking-tighter">
                          <span className="text-[10px] mr-1 opacity-50">{req.currency}</span>
                          {req.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="p-8 text-center">
                        <span className="px-4 py-2 bg-orange-50 text-[#A67C52] rounded-xl text-[9px] font-black uppercase border border-orange-100">
                          {req.currentStage}
                        </span>
                      </td>
                      <td className="p-8 text-center">
                        <button 
                          onClick={() => setSelectedReq(req)}
                          className="bg-[#A67C52] text-white text-[10px] font-black px-6 py-3 rounded-xl shadow-lg hover:bg-black transition-all uppercase tracking-widest"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- DETAIL OVERVIEW MODAL --- */}
        {selectedReq && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <button onClick={() => setSelectedReq(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black font-black text-xl">✕</button>

              <div className="p-10 md:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-black text-[#A67C52] uppercase tracking-tighter">Requisition Details</h2>
                      <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-widest">ID: {selectedReq._id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Amount Due</p>
                        <p className="text-xl font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Expected Date</p>
                        <p className="text-sm font-bold text-gray-800">{new Date(selectedReq.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Justification Narrative</p>
                      <p className="text-gray-700 leading-relaxed italic bg-orange-50/30 p-6 rounded-3xl border border-orange-100">
                        "{selectedReq.requestNarrative}"
                      </p>
                    </div>

                    {/* Supporting Document Section */}
                    <div className="bg-[#A67C52] p-6 rounded-3xl text-white flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">Support Files</p>
                        <p className="text-sm font-bold truncate max-w-[180px]">{selectedReq.attachmentName || "View Invoice"}</p>
                      </div>
                      <button 
                        onClick={() => handleDownload(selectedReq.attachmentUrl)}
                        className="bg-white text-[#A67C52] px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-orange-50 transition-all flex items-center gap-2"
                      >
                        📂 Open Cloud Document
                      </button>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-gray-50">
                      <button 
                        onClick={() => handleAction(selectedReq._id, 'Approved')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20"
                      >
                        {user.role === 'Admin' ? 'Super Override' : 'Approve'}
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