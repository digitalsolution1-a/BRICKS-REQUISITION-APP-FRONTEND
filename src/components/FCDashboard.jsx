import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchFCRequests = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/requisitions/pending/FC`);
        setRequisitions(res.data);
      } catch (err) {
        toast.error("Failed to load FC queue");
      } finally {
        setLoading(false);
      }
    };
    fetchFCRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'FC',
        actorName: user.name,
        comment: action === 'Approved' ? 'Vetted and cleared for MD' : 'Declined at FC stage'
      });
      toast.success(`Request ${action}`);
      setRequisitions(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      toast.error("Action failed");
    }
  };

  if (loading) return <div className="p-10 font-black text-center animate-pulse">SYNCING FC QUEUE...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 uppercase">
      <h1 className="text-3xl font-black mb-6">Financial Controller <span className="text-[#A67C52]">Verification</span></h1>
      <div className="grid gap-4">
        {requisitions.map(req => (
          <div key={req._id} className="bg-white p-6 rounded-3xl border shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-blue-500 mb-1">{req.department} | HOD APPROVED</p>
              <h3 className="text-xl font-black">{req.requesterName}</h3>
              <p className="text-xs font-bold text-gray-500">{req.amountInWords}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#A67C52]">{req.currency} {req.amount?.toLocaleString()}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleAction(req._id, 'Approved')} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black">VERIFY & SEND TO MD</button>
                <button onClick={() => handleAction(req._id, 'Declined')} className="bg-red-50 text-red-500 px-6 py-2 rounded-xl text-[10px] font-black">DECLINE</button>
              </div>
            </div>
          </div>
        ))}
        {requisitions.length === 0 && <p className="text-center font-black text-gray-300 py-20">No pending verifications for FC</p>}
      </div>
    </div>
  );
};

export default FCDashboard;
