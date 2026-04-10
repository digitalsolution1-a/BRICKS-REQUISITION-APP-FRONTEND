import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function StaffDashboard() {
  const [myRequests, setMyRequests] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/requisitions/user/${user._id || user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMyRequests(res.data);
      } catch (err) {
        console.error("Fetch error", err);
      }
    };
    fetchMyRequests();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1: The Action Card */}
        <div className="md:col-span-1 bg-[#A67C52] rounded-[2rem] p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black leading-tight uppercase">New Request</h2>
            <p className="text-orange-100 text-xs mt-2 opacity-80">Submit a new procurement or operational requisition.</p>
          </div>
          <Link to="/requisition-form" className="mt-8 bg-white text-[#A67C52] text-center py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
            + Create New
          </Link>
        </div>

        {/* Card 2: The List Card */}
        <div className="md:col-span-3 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black uppercase text-gray-800 mb-6">My Requisitions</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Vendor</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myRequests.map((req) => (
                  <tr key={req._id} className="text-sm font-bold text-gray-600 hover:bg-gray-50/50">
                    <td className="py-4">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-black text-gray-800">{req.vendorName}</td>
                    <td className="py-4">{req.currency} {req.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black ${
                        req.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {req.status === 'Pending' && (
                        <button 
                          onClick={() => navigate(`/edit-requisition/${req._id}`)}
                          className="text-[#A67C52] hover:underline uppercase text-xs font-black"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
