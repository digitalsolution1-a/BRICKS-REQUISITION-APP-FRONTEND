import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { generateRequisitionPDF } from '../utils/pdfGenerator';

function StaffDashboard() {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NATIVE PWA & UI STATES
  const [showProfile, setShowProfile] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      if (!user?.email) {
        navigate('/');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/requisitions/user/${user._id || user.id}?email=${user.email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMyRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error", err);
      toast.error("Failed to load your requisitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [API_BASE_URL, user.email, token]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out safely");
    navigate('/');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF9F6]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#A67C52] mb-4"></div>
      <p className="font-black text-[#A67C52] text-[10px] tracking-widest uppercase">Syncing your workspace...</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen uppercase">
      {/* --- NATIVE NAV BAR --- */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-xl flex items-center justify-center font-black text-xl italic text-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Staff Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link to="/submit-requisition" className="hidden md:block text-[10px] font-black tracking-widest text-[#A67C52] hover:text-white transition-all">
            + NEW REQUEST
          </Link>
          
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all"
          >
            <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'ST'}</span>
          </button>
        </div>
      </nav>

      {/* EXECUTIVE PROFILE DROPDOWN */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'ST'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Staff Member'}</h4>
            <p className="text-[9px] font-bold text-gray-400 mt-2 tracking-widest">{user?.email}</p>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-50">
             <Link to="/profile" className="block w-full text-center px-4 py-3 rounded-xl text-[9px] font-black bg-gray-50 hover:bg-[#A67C52] hover:text-white transition-all uppercase tracking-widest">
               View Profile
             </Link>
             <button onClick={handleLogout} className="w-full text-center px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
               Sign Out
             </button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ACTION CARD */}
          <div className="md:col-span-1 bg-[#A67C52] rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between h-fit md:h-[450px] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black leading-none uppercase tracking-tighter italic">Create <br/> <span className="text-black">Request</span></h2>
              <p className="text-orange-100 text-[10px] mt-6 opacity-80 uppercase tracking-widest font-black leading-loose">
                Submit procurement details for departmental review and MD approval.
              </p>
            </div>
            <Link 
              to="/submit-requisition" 
              className="relative z-10 bg-black text-white text-center py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95"
            >
              + Initiate Form
            </Link>
          </div>

          {/* LIST CARD */}
          <div className="md:col-span-3 bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tighter italic">Submission <span className="text-[#A67C52]">Archive</span></h2>
                <p className="text-[9px] font-black text-gray-400 mt-1 tracking-widest uppercase">Tracking your personal requisition history</p>
              </div>
              <div className="text-[10px] font-black text-[#A67C52] uppercase tracking-[0.2em] bg-[#FBF9F6] border border-[#A67C52]/10 px-6 py-2 rounded-full shadow-inner">
                Total Files: {myRequests.length}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="pb-6">Date</th>
                    <th className="pb-6">Vendor / Detail</th>
                    <th className="pb-6">Amount</th>
                    <th className="pb-6">Status</th>
                    <th className="pb-6 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-24 text-center">
                        <p className="text-xs font-black text-gray-300 uppercase tracking-[0.4em] italic underline decoration-[#A67C52] decoration-2 underline-offset-8">No records available</p>
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((req) => (
                      <tr key={req._id} className="text-sm font-bold text-gray-600 hover:bg-[#FBF9F6] transition-all group">
                        <td className="py-6 whitespace-nowrap text-[11px] font-black text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-6">
                          <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{req.vendorName || "General Requisition"}</p>
                          <p className="text-[9px] text-gray-400 mt-1 italic">REF: #{req._id.slice(-6)}</p>
                        </td>
                        <td className="py-6 whitespace-nowrap font-black text-[#A67C52] text-xs">
                          {req.currency} {req.amount.toLocaleString()}
                        </td>
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-black tracking-widest ${
                            req.status === 'Pending' ? 'bg-orange-50 text-orange-500 border border-orange-100' : 
                            req.status === 'Paid' ? 'bg-green-50 text-green-600 border border-green-100' :
                            req.status === 'Declined' ? 'bg-red-50 text-red-500 border border-red-100' : 
                            'bg-gray-50 text-gray-500 border border-gray-100'
                          }`}>
                            {req.status === 'Approved' ? 'PROCESSING' : req.status}
                          </span>
                        </td>
                        <td className="py-6 text-right flex justify-end gap-3 items-center">
                          <button 
                            onClick={() => generateRequisitionPDF(req)}
                            className="w-10 h-10 bg-gray-50 hover:bg-black hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm border border-gray-100"
                            title="Export PDF"
                          >
                            <span className="text-sm">📄</span>
                          </button>

                          {req.status === 'Pending' && (
                            <button 
                              onClick={() => navigate(`/edit-requisition/${req._id}`)}
                              className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A67C52] transition-all shadow-lg active:scale-95"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
