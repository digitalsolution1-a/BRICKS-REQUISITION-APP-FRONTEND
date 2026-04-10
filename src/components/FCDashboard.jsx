import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchFCRequests = async () => {
    try {
      setLoading(true);
      // Ensure the endpoint is strictly /FC
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/FC`);
      setRequisitions(res.data);
    } catch (err) {
      toast.error("Failed to load FC queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFCRequests();
  }, []);

  const handleAction = async (id, action) => {
    const comment = prompt(`Reason for ${action}:`, action === 'Approved' ? 'Vetted and cleared for MD' : '');
    if (comment === null) return;

    const loadingToast = toast.loading('Updating record...');
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'FC',
        actorName: user.name,
        comment: comment
      });
      
      toast.success(`Request ${action} successfully`, { id: loadingToast });
      setRequisitions(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      toast.error("Action failed", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER SECTION */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-sm font-black tracking-tighter uppercase">Bricks <span className="text-blue-600">Finance</span></h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Financial Controller Portal</p>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black bg-gray-100 px-4 py-2 rounded-lg hover:bg-red-50 transition-all">LOGOUT</button>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 uppercase">Verification Queue</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Vetting HOD-Approved Requisitions</p>
        </div>

        <div className="grid gap-6">
          {requisitions.map(req => (
            <div key={req._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              {/* Left Stripe: Visual Indicator */}
              <div className="w-2 bg-blue-600"></div>
              
              <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">Vetting Required</span>
                    <span className="text-gray-300 font-bold text-[9px] uppercase tracking-widest">Dept: {req.department}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-800 uppercase leading-none mb-1">{req.vendorName || req.requesterName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase italic">Ref: {req._id}</p>
                </div>

                <div className="w-full md:w-auto text-center md:text-right">
                  <p className="text-2xl font-black text-gray-900">{req.currency} {req.amount?.toLocaleString()}</p>
                  <div className="flex gap-2 mt-4 md:justify-end">
                    <button 
                      onClick={() => handleAction(req._id, 'Approved')} 
                      className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Clear for MD
                    </button>
                    <button 
                      onClick={() => handleAction(req._id, 'Declined')} 
                      className="flex-1 md:flex-none bg-white border border-red-100 text-red-500 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {requisitions.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-300 font-black uppercase tracking-widest text-xs">All Finance Verifications Complete</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FCDashboard;
