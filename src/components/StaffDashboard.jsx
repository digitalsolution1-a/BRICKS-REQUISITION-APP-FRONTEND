import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { generateRequisitionPDF } from '../utils/pdfGenerator';

function StaffDashboard() {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        // Fetching by User ID with email as a fallback query param for backend logic
        const res = await axios.get(`${API_BASE_URL}/requisitions/user/${user._id || user.id}?email=${user.email}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMyRequests(res.data);
      } catch (err) {
        console.error("Fetch error", err);
        toast.error("Failed to load your requisitions");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMyRequests();
  }, [API_BASE_URL, user]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out safely");
    navigate('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* --- CORPORATE NAV BAR --- */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-gray-900 uppercase leading-none">Bricks</span>
              <span className="text-[8px] font-bold text-[#A67C52] tracking-[0.2em] uppercase">Staff Portal</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/profile" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#A67C52] transition-colors">
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-red-600 transition-all active:scale-95 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Card 1: The Action Card */}
          <div className="md:col-span-1 bg-[#A67C52] rounded-[2rem] p-8 text-white shadow-xl flex flex-col justify-between h-fit md:h-[400px]">
            <div>
              <h2 className="text-2xl font-black leading-tight uppercase">New Request</h2>
              <p className="text-orange-100 text-[10px] mt-2 opacity-80 uppercase tracking-widest font-bold">
                Submit a new procurement or operational requisition.
              </p>
            </div>
            <Link 
              to="/submit-requisition" 
              className="mt-8 bg-white text-[#A67C52] text-center py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg active:scale-95"
            >
              + Create New
            </Link>
          </div>

          {/* Card 2: The List Card */}
          <div className="md:col-span-3 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase text-gray-800 tracking-tight">My Requisitions</h2>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                Records: {myRequests.length}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Vendor</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-xs font-black text-gray-300 uppercase animate-pulse">
                        Syncing your records...
                      </td>
                    </tr>
                  ) : myRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-xs font-black text-gray-400 uppercase italic">
                        No requisitions found.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((req) => (
                      <tr key={req._id} className="text-sm font-bold text-gray-600 hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 whitespace-nowrap text-[12px]">
                          {new Date(req.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-4 font-black text-gray-800 uppercase text-xs">
                          {req.vendorName}
                        </td>
                        <td className="py-4 whitespace-nowrap font-black text-gray-700">
                          {req.currency} {req.amount.toLocaleString()}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black ${
                            req.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                            req.status === 'Paid' ? 'bg-green-100 text-green-600' :
                            req.status === 'Declined' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 text-right flex justify-end gap-3 items-center">
                          {/* PDF Download Action */}
                          <button 
                            onClick={() => generateRequisitionPDF(req)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-90"
                            title="Download PDF"
                          >
                            <span className="text-lg">📄</span>
                          </button>

                          {/* Edit Action (Only for Pending) */}
                          {req.status === 'Pending' && (
                            <button 
                              onClick={() => navigate(`/edit-requisition/${req._id}`)}
                              className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#A67C52] transition-all shadow-sm"
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
