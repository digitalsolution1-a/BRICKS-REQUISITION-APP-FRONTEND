import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getSecureUrl, revokeFileUrl } from '../utils/fileHandler';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); 
  const [selectedReq, setSelectedReq] = useState(null); 
  const [fcComment, setFcComment] = useState('');
  
  // File Preview States
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    if (!token) return navigate('/');
    try {
      setLoading(true);
      const [queueRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/FC`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      const queueData = Array.isArray(queueRes.data) ? queueRes.data : [];
      setRequisitions(queueData);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);

      if ('setAppBadge' in navigator) {
        queueData.length > 0 ? navigator.setAppBadge(queueData.length) : navigator.clearAppBadge();
      }
    } catch (err) {
      toast.error("Failed to sync financial portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  const handleOpenVetting = async (req) => {
    setSelectedReq(req);
    setFcComment('');
    setIsFetchingFile(true);
    
    // FETCH SECURE BLOB FROM CLOUDINARY/SERVER
    if (req.attachmentUrl) {
      const secureUrl = await getSecureUrl(req.attachmentUrl, token);
      setPreviewUrl(secureUrl);
    }
    setIsFetchingFile(false);
  };

  const handleCloseModal = () => {
    if (previewUrl) revokeFileUrl(previewUrl);
    setPreviewUrl(null);
    setSelectedReq(null);
  };

  const handleAction = async (id, action) => {
    if (!fcComment && action === 'Declined') {
      return toast.error("Please provide instructions for decline");
    }

    const loadingToast = toast.loading('Synchronizing results...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'FC',
        actorName: user?.name || 'Financial Controller',
        comment: fcComment || (action === 'Approved' ? 'Vetted and cleared for MD' : 'Declined at FC stage')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(action === 'Approved' ? 'FORWARDED TO MD' : 'DECLINED', { id: loadingToast });
      handleCloseModal();
      fetchData(); 
    } catch (err) {
      toast.error("Action failed", { id: loadingToast });
    }
  };

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  const exportToExcel = () => {
    const dataToExport = activeTab === 'queue' ? filterList(requisitions) : filterList(history);
    if (dataToExport.length === 0) return toast.error("No data to export");
    const headers = "ID,Date,Requester,Dept,Vendor,Amount,Status\n";
    const csv = dataToExport.map(r => `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.department},${r.vendorName || 'N/A'},${r.amount},${r.status}`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_FC_Report.csv`;
    a.click();
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-4 border-[#A67C52] border-t-transparent rounded-full mb-4"></div>
      <p className="text-[10px] font-black tracking-widest text-[#A67C52]">SYNCHRONIZING FINANCIAL PORTAL...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVIGATION */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black text-xs">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Finance</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">FC DASHBOARD</p>
          </div>
        </div>
        <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg">
          <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase()}</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 italic">FC <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button onClick={() => setActiveTab('queue')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'queue' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>
                PENDING ({requisitions.length})
              </button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>
                HISTORY ({history.length})
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <input type="text" placeholder="SEARCH..." className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold w-72 outline-none focus:border-[#A67C52]" onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={exportToExcel} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black hover:bg-[#A67C52] transition-all">EXPORT</button>
          </div>
        </div>

        <div className="grid gap-4">
          {filterList(activeTab === 'queue' ? requisitions : history).map(req => (
            <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50 text-gray-800">
                  <span className="text-[8px] font-black text-[#A67C52]">{req.currency}</span>
                  <span className="text-sm font-black">{req.amount?.toLocaleString()}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none">{req.requesterName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 italic">{req.department}</p>
                </div>
              </div>
              {activeTab === 'queue' && (
                <button onClick={() => handleOpenVetting(req)} className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">
                  VET REQUEST
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* --- VETTING MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic underline decoration-[#A67C52] decoration-4 underline-offset-8">Financial Vetting</h3>
                <button onClick={handleCloseModal} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
                <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-gray-400">Staff</p><p className="text-xs font-black">{selectedReq.requesterName}</p></div>
                <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-gray-400">Dept</p><p className="text-xs font-black">{selectedReq.department}</p></div>
                <div className="bg-gray-50 p-4 rounded-2xl col-span-2"><p className="text-[9px] font-black text-gray-400">Value</p><p className="text-xs font-black text-[#A67C52]">{selectedReq.currency} {selectedReq.amount?.toLocaleString()}</p></div>
              </div>

              {/* AUDIT EVIDENCE VIEWER */}
              <div className="mb-10 text-left">
                <p className="text-[9px] font-black text-gray-400 mb-3 tracking-widest uppercase">Audit Evidence Review</p>
                <div className="w-full h-[500px] rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-100 overflow-hidden relative shadow-inner flex items-center justify-center">
                  {isFetchingFile ? (
                    <div className="text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-[#A67C52] border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-[8px] font-black text-[#A67C52]">DECRYPTING ATTACHMENT...</p>
                    </div>
                  ) : previewUrl ? (
                    <embed src={previewUrl} className="w-full h-full rounded-[2.5rem]" />
                  ) : (
                    <p className="text-[10px] font-black text-red-300">NO ATTACHMENT PROVIDED</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 text-left">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase">FC Vetting Remarks</p>
                <textarea 
                  value={fcComment}
                  onChange={(e) => setFcComment(e.target.value)}
                  placeholder="Notes for MD..."
                  className="w-full h-24 bg-gray-50 border-2 border-transparent rounded-2xl p-6 text-xs font-bold outline-none focus:border-[#A67C52] transition-all mb-6"
                />
                <div className="flex gap-4">
                  <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl hover:scale-[1.02] transition-all">FORWARD TO MD</button>
                  <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all">DECLINE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FCDashboard;
