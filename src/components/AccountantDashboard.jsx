import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RequisitionHistory from '../components/RequisitionHistory';
import AttachmentViewer from '../components/AttachmentViewer';

const AccountantDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [view, setView] = useState('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [paymentComment, setPaymentComment] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueRes, historyRes, allDeptsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setAllDepartments(Array.isArray(allDeptsRes.data) ? allDeptsRes.data : []);
    } catch (err) { toast.error("Failed to sync data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filterList = (list) => {
    return (list || []).filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  const handlePaymentComplete = async (id) => {
    const loadingToast = toast.loading('Processing...');
    try {
      const formData = new FormData();
      formData.append('action', 'Paid');
      formData.append('comment', paymentComment || 'Paid');
      if (paymentFile) formData.append('receipt', paymentFile);
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Updated!", { id: loadingToast });
      setSelectedReq(null);
      fetchData();
    } catch (err) { toast.error("Failed.", { id: loadingToast }); }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex">
      {/* SIDEBAR NAVIGATION */}
      <nav className="w-64 bg-black p-8 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-[#A67C52] rounded-2xl flex items-center justify-center font-black text-xl mb-10">B</div>
          <div className="space-y-4">
            {[
              { id: 'queue', label: 'ACTIVE QUEUE' },
              { id: 'history', label: 'HISTORY' },
              { id: 'all', label: 'ALL DEPTS' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`w-full text-left text-[10px] font-black p-4 rounded-xl transition-all ${view === tab.id ? 'bg-[#A67C52] text-black' : 'text-gray-500 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => {localStorage.clear(); navigate('/');}} className="text-[10px] text-red-500 font-black">SIGN OUT</button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        <input 
          className="w-full bg-white p-4 rounded-2xl mb-8 text-[10px] font-bold shadow-sm"
          placeholder="SEARCH VENDOR OR REF..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="space-y-4">
          {view === 'queue' && filterList(requisitions).map(req => (
            <div key={req._id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
              <div><h3 className="font-black text-sm">{req.vendorName}</h3><p className="text-[9px] text-gray-400">Ref: {req._id}</p></div>
              <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black">PAY</button>
            </div>
          ))}

          {view === 'history' && <RequisitionHistory requisitions={filterList(history)} />}
          
          {view === 'all' && (
            <div className="grid grid-cols-1 gap-4">
              {filterList(allDepartments).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-black text-sm">{req.vendorName}</h3>
                  <p className="text-[10px]">{req.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL (Same as previous implementation) */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white p-10 rounded-[2rem] w-full max-w-lg">
             <h2 className="text-xl font-black mb-6">CONFIRM PAYMENT</h2>
             <textarea className="w-full bg-gray-50 p-4 rounded-xl mb-4" onChange={(e) => setPaymentComment(e.target.value)} />
             <button onClick={() => handlePaymentComplete(selectedReq._id)} className="w-full bg-[#A67C52] py-4 rounded-xl font-black">CONFIRM</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
