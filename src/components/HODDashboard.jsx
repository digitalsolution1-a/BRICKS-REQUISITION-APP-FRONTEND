import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AttachmentViewer from '../components/AttachmentViewer';
import RequisitionHistory from '../components/RequisitionHistory';

const HODDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDeptReqs, setAllDeptReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [hodComment, setHodComment] = useState('');

  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window ? Notification.permission === 'granted' : false
  );

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const selectedReq = 
    requisitions.find((r) => r._id === selectedReqId) || 
    history.find((r) => r._id === selectedReqId) ||
    allDeptReqs.find((r) => r._id === selectedReqId) || null;

  const syncPortal = async () => {
    if (!token || !user.email) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const [queueRes, historyRes, allRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/HOD?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/requisitions/history/HOD?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);

      const dept = user.department;
      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data.filter(r => r.department === dept) : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data.filter(r => r.department === dept) : []);
      setAllDeptReqs(Array.isArray(allRes.data) ? allRes.data.filter(r => r.department === dept) : []);

      if ('setAppBadge' in navigator) {
        queueRes.data?.length > 0 ? navigator.setAppBadge(queueRes.data.length) : navigator.clearAppBadge();
      }
    } catch (err) {
      console.error("Portal Sync Error:", err);
      toast.error("Global portal sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncPortal();
  }, [user.email, API_BASE_URL, token]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Notifications not supported");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("MANAGEMENT ALERTS SYNCED");
    }
  };

  const filterList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(req => 
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id.includes(searchTerm)
    );
  };

  const exportData = () => {
    const targetData = activeTab === 'queue' ? filterList(requisitions) : activeTab === 'history' ? filterList(history) : filterList(allDeptReqs);
    if (targetData.length === 0) return toast.error("Nothing to export");

    const headers = "ID,Date,Staff,Amount,Vendor,Status\n";
    const csvContent = targetData.map(r => 
      `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.amount},${r.vendorName || 'N/A'},${r.status}`
    ).join("\n");

    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bricks_HOD_${activeTab}_Report.csv`;
    link.click();
  };

  const handleAction = async (id, action) => {
    if (action === 'Declined' && !hodComment) return toast.error("A reason is required to decline.");

    const loadingToast = toast.loading(`${action}ing request...`);
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action, actorRole: 'HOD', actorName: user.name,
        comment: hodComment || (action === 'Approved' ? 'Departmental approval granted.' : '')
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(action === 'Approved' ? 'SENT TO FINANCE' : 'DECLINED', { id: loadingToast });
      setSelectedReqId(null);
      setHodComment('');
      syncPortal(); 
    } catch (err) {
      toast.error("Action could not be processed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#A67C52] mb-4"></div>
      <p className="text-[#A67C52] font-black text-xs uppercase tracking-widest">Syncing...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* Navbar, Profile, Main, and Modal remain unchanged as per your requirements */}
      {/* [Existing JSX Structure Here] */}
      {/* ... */}
      
      {/* Modal */}
      {selectedReq && ( 
         <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between mb-8">
                  <h3 className="text-2xl font-black italic underline decoration-[#A67C52]">REVIEW</h3>
                  <button onClick={() => setSelectedReqId(null)} className="font-black text-xl">✕</button>
               </div>
               
               <div className="grid grid-cols-2 gap-6 mb-8 text-xs font-bold">
                  <div><p className="text-gray-400">REQUESTER</p><p>{selectedReq.requesterName}</p></div>
                  <div><p className="text-gray-400">AMOUNT</p><p>{selectedReq.amount} {selectedReq.currency}</p></div>
               </div>

               {activeTab === 'queue' && (
                 <div className="flex flex-col gap-4 border-t pt-6">
                    <input type="text" placeholder="COMMENT (REQUIRED FOR DECLINE)..." className="border-2 border-gray-100 p-4 rounded-xl text-[10px] font-black" value={hodComment} onChange={(e) => setHodComment(e.target.value)} />
                    <div className="flex gap-4">
                       <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px]">APPROVE</button>
                       <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px]">DECLINE</button>
                    </div>
                 </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default HODDashboard;
