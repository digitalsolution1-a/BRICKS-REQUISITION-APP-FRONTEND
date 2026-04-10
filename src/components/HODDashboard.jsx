import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        // We pass HOD and the specific email for filtering
        const res = await axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`);
        setRequisitions(res.data);
      } catch (err) {
        console.error("Error fetching approvals:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) fetchRequisitions();
  }, [user.email]);

  const handleAction = async (id, action) => {
    const comment = prompt(`Enter comment for ${action}:`);
    if (comment === null) return;

    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        comment,
        actorRole: 'HOD',
        actorName: user.name
      });
      setRequisitions(requisitions.filter(r => r._id !== id));
      alert(`Requisition ${action}`);
    } catch (err) {
      alert("Action failed");
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-[#A67C52]">SYNCING APPROVAL HUB...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Approval Hub</h1>
          <p className="text-[#A67C52] font-bold text-xs uppercase tracking-widest">HOD Pending Review</p>
        </header>

        {requisitions.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-gray-200">
            <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">No pending requests found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requisitions.map((req) => (
              <div key={req._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-orange-100 text-[#A67C52] text-[10px] font-black px-3 py-1 rounded-full uppercase">{req.department}</span>
                    <span className="text-gray-400 text-[10px] font-bold uppercase">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 uppercase leading-none mb-2">{req.requesterName}</h3>
                  <p className="text-sm font-bold text-gray-600 mb-1">{req.vendorName} • {req.requestType}</p>
                  <p className="text-sm italic text-gray-400 line-clamp-1">{req.requestNarrative}</p>
                </div>

                <div className="text-right px-6 border-r border-l border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Amount</p>
                  <p className="text-2xl font-black text-[#A67C52]">{req.currency} {req.amount.toLocaleString()}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleAction(req._id, 'Approved')} className="bg-[#A67C52] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Approve</button>
                  <button onClick={() => handleAction(req._id, 'Declined')} className="bg-white border-2 border-red-100 text-red-500 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
