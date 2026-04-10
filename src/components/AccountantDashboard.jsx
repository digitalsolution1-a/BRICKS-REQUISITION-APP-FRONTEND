import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAccountsQueue = async () => {
    try {
      setLoading(true);
      // Fetches requisitions specifically at the 'ACCOUNTS' or 'ACCOUNTANT' stage
      const res = await axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`);
      setRequisitions(res.data);
    } catch (err) {
      toast.error("Failed to sync treasury data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsQueue();
  }, []);

  // --- Search Logic ---
  const filteredRequests = requisitions.filter(req => 
    req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req._id.includes(searchTerm)
  );

  // --- Export Logic (Simple CSV) ---
  const exportToCSV = () => {
    const headers = ["ID,Requester,Vendor,Amount,Currency,MD Instructions\n"];
    const rows = filteredRequests.map(r => 
      `${r._id},${r.requesterName},${r.vendorName},${r.amount},${r.currency},"${r.approvalHistory?.find(h => h.role === 'MD')?.comment || ''}"\n`
    );
    const blob = new Blob([headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_Payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePaymentComplete = async (id) => {
    const confirmPayment = window.confirm("Confirm this requisition has been paid/disbursed?");
    if (!confirmPayment) return;

    const loadingToast = toast.loading('Updating Treasury Records...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: 'Approved', // In the backend, this marks it as 'Paid' at this final stage
        actorRole: 'ACCOUNTANT',
        actorName: 'Accounts Department',
        comment: 'Disbursement Completed'
      });
      toast.success("Payment Recorded", { id: loadingToast });
      fetchAccountsQueue();
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-[#A67C52] border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F9]">
      {/* NAVIGATION */}
      <nav className="bg-black text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="font-black tracking-widest text-xs uppercase italic">Bricks Treasury</span>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-[9px] font-black border border-white/20 px-3 py-1 rounded">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER & TOOLS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Disbursement Hub</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Final Approval & Payment Stage</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="SEARCH VENDOR OR REF..."
              className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold flex-1 md:w-64 outline-none focus:border-[#A67C52]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* REQUISITION LIST */}
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const mdApproval = req.approvalHistory?.find(h => h.role === 'MD');
            
            return (
              <div key={req._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                  {/* Left: Requester Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded">READY FOR PAYMENT</span>
                      <span className="text-gray-300 font-bold text-[9px]">REF: {req._id.slice(-8)}</span>
                    </div>
                    <h2 className="text-xl font-black text-gray-800 uppercase">{req.vendorName || "General Vendor"}</h2>
                    <p className="text-xs font-bold text-gray-500 mt-1">Requested by: <span className="text-black">{req.requesterName}</span></p>
                    
                    {/* MD INSTRUCTIONS - The Most Important Part */}
                    <div className="mt-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <p className="text-[9px] font-black text-[#A67C52] uppercase tracking-[0.2em] mb-1">MD Final Instructions:</p>
                      <p className="text-sm font-bold text-orange-900 italic">
                        "{mdApproval?.comment || "Proceed with standard disbursement."}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-between items-end md:w-64">
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 leading-none">{req.currency} {req.amount.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Balance to be disbursed</p>
                    </div>
                    
                    <button 
                      onClick={() => handlePaymentComplete(req._id)}
                      className="w-full bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A67C52] transition-colors mt-6 shadow-xl"
                    >
                      Mark as Paid & Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="py-20 text-center border-4 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-300 font-black uppercase tracking-[0.3em]">Treasury Queue Empty</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountantDashboard;
