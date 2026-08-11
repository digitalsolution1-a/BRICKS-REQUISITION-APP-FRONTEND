import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AttachmentViewer from '../components/AttachmentViewer';
import RequisitionHistory from '../components/RequisitionHistory';

const FCDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); 
  const [selectedReq, setSelectedReq] = useState(null); 
  const [fcComment, setFcComment] = useState('');
  
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Currency normalizer helper
  const getStandardCurrency = (currencyStr) => {
    if (!currencyStr) return 'NGN';
    const c = String(currencyStr).trim().toUpperCase();
    if (c === '$' || c === 'USD' || c === 'DOLLAR' || c === 'US DOLLAR') return 'USD';
    if (c === '₦' || c === 'NGN' || c === 'NAIRA') return 'NGN';
    return c;
  };

  // Helper to extract HOD Comment from approval history
  const getHODComment = (historyArray) => {
    if (!historyArray || !Array.isArray(historyArray)) return null;
    const hodEntry = [...historyArray].find(entry => entry.actorRole === 'HOD');
    return hodEntry ? hodEntry.comment : null;
  };

  const fetchData = async () => {
    if (!token) return navigate('/');
    try {
      setLoading(true);
      const [queueRes, historyRes, allDepartmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/FC`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history/FC`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setAllDepartments(Array.isArray(allDepartmentsRes.data) ? allDepartmentsRes.data : []);

      if ('setAppBadge' in navigator) {
        queueRes.data?.length > 0 ? navigator.setAppBadge(queueRes.data.length) : navigator.clearAppBadge();
      }
    } catch (err) {
      console.error("Sync Error:", err);
      toast.error("Failed to sync financial portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  const handleOpenVetting = (req) => {
    setSelectedReq(req);
    setFcComment('');
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return toast.error("Not supported");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success("FINANCE ALERTS ACTIVE", {
        icon: '🔔',
        style: { background: '#000', color: '#A67C52', fontWeight: 'bold' }
      });
    }
  };

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  // Calculate total amounts vetted/approved by THIS SPECIFIC FC
  // excluding any requisitions that were later rejected or declined downstream
  const computeFCApprovedTotals = () => {
    const approvedList = filterList(history).filter((req) => {
      const currentStatus = String(req.status || '').toUpperCase().trim();

      // 1. Exclude any requisition currently in a declined or rejected state
      const isCurrentlyRejected = 
        currentStatus.includes('DECLINED') || 
        currentStatus.includes('REJECTED');

      if (isCurrentlyRejected) {
        return false;
      }

      // 2. Verify that this specific FC granted approval in the approval history
      const approvedByThisUser = req.approvalHistory?.some((entry) => {
        const isApprovedAction = String(entry.action || '').toUpperCase() === 'APPROVED';
        const isFCRole = String(entry.actorRole || '').toUpperCase() === 'FC';
        
        const matchesUser = 
          (user.email && (entry.actorEmail === user.email || entry.email === user.email)) ||
          (user.name && (entry.actorName === user.name || entry.name === user.name)) ||
          (user._id && (entry.actorId === user._id || entry.userId === user._id));

        return isApprovedAction && isFCRole && (matchesUser || !user.email);
      });

      // 3. Fallback check for direct fields
      const directUserMatch = 
        (req.vettedByEmail && req.vettedByEmail === user.email) ||
        (req.fcEmail && req.fcEmail === user.email) ||
        (req.vettedBy && req.vettedBy === user.name);

      return approvedByThisUser || directUserMatch;
    });

    return approvedList.reduce(
      (acc, req) => {
        const currency = getStandardCurrency(req.currency);
        const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
        acc[currency] = (acc[currency] || 0) + cleanedAmount;
        return acc;
      },
      { NGN: 0, USD: 0 }
    );
  };

  const totalsByCurrency = computeFCApprovedTotals();

  const exportToExcel = () => {
    let dataToExport = [];
    if (activeTab === 'queue') dataToExport = filterList(requisitions);
    else if (activeTab === 'history') dataToExport = filterList(history);
    else dataToExport = filterList(allDepartments);

    if (dataToExport.length === 0) return toast.error("No data to export");
    const headers = "ID,Date,Requester,Department,Vendor,Amount,Currency,Status\n";
    const data = dataToExport.map(r => {
      const cleanedAmount = parseFloat(String(r.amount || '0').replace(/[^0-9.]/g, '')) || 0;
      return `${r._id},${new Date(r.createdAt).toLocaleDateString()},${r.requesterName},${r.department},${r.vendorName || 'N/A'},${cleanedAmount},${getStandardCurrency(r.currency)},${r.status}`;
    }).join("\n");
    const blob = new Blob([headers + data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_FC_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAction = async (id, action) => {
    if (!fcComment && action === 'Declined') {
      return toast.error("Please provide instructions/reason for decline");
    }
    const loadingToast = toast.loading('Synchronizing vetting results...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action,
        actorRole: 'FC',
        actorName: user?.name || 'Financial Controller',
        actorEmail: user?.email,
        comment: fcComment || (action === 'Approved' ? 'Vetted and cleared for MD' : 'Declined at FC stage')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (activeTab === 'all' && action === 'Approved') {
        toast.success('LOG MEMO SAVED', { id: loadingToast });
      } else {
        toast.success(action === 'Approved' ? 'FORWARDED TO MD' : 'DECLINED', { id: loadingToast });
      }
      
      handleCloseModal();
      fetchData(); 
    } catch (err) {
      toast.error("Action failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-4 border-[#A67C52] border-t-transparent rounded-full mb-4"></div>
      <p className="text-[10px] font-black tracking-widest text-[#A67C52]">SYNCHRONIZING FINANCIAL PORTAL...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F6] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black text-xs">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Finance</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">FC DASHBOARD</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {!notificationsEnabled && (
             <button onClick={handleEnableNotifications} className="hidden md:block bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all">🔔 ENABLE ALERTS</button>
           )}
           <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg">
             <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'FC'}</span>
           </button>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'FC'}
            </div>
            <h4 className="text-sm font-black text-gray-900">{user?.name || 'Financial Controller'}</h4>
            <p className="text-[9px] font-bold text-[#A67C52]">Department: Finance</p>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-50">
             <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">SIGN OUT</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none italic">FC <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button onClick={() => setActiveTab('queue')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'queue' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>PENDING REVIEW ({requisitions.length})</button>
              <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>VETTING HISTORY ({history.length})</button>
              <button onClick={() => setActiveTab('all')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'all' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>ALL DEPARTMENTS ({allDepartments.length})</button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* NAIRA VETTED/APPROVED CARD */}
            <div className="bg-black text-white px-5 py-3 rounded-2xl shadow-md border border-black min-w-[150px]">
              <p className="text-[8px] font-black text-[#A67C52] tracking-widest uppercase">
                Vetted By You (NGN)
              </p>
              <p className="text-xs font-black tracking-tight mt-1 text-white">
                NGN {totalsByCurrency.NGN.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* DOLLAR VETTED/APPROVED CARD */}
            <div className="bg-black text-white px-5 py-3 rounded-2xl shadow-md border border-black min-w-[150px]">
              <p className="text-[8px] font-black text-[#A67C52] tracking-widest uppercase">
                Vetted By You (USD)
              </p>
              <p className="text-xs font-black tracking-tight mt-1 text-white">
                USD ${totalsByCurrency.USD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>

            <input 
              type="text" 
              placeholder="SEARCH..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 text-[10px] font-bold flex-1 min-w-[200px] outline-none focus:border-[#A67C52] shadow-sm" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button onClick={exportToExcel} className="bg-black text-white px-8 py-3.5 rounded-2xl text-[10px] font-black hover:bg-[#A67C52] transition-all shadow-lg">EXPORT CSV</button>
          </div>
        </div>

        <div className="grid gap-4">
          {activeTab === 'queue' && (
            <>
              {filterList(requisitions).map(req => {
                const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
                const standardCurrency = getStandardCurrency(req.currency);

                return (
                  <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50 px-2 text-center">
                        <span className="text-[8px] font-black text-[#A67C52]">{standardCurrency}</span>
                        <span className="text-sm font-black text-gray-800">{cleanedAmount.toLocaleString('en-US')}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">HOD Approved</span>
                          <span className="text-gray-400 font-bold text-[9px] tracking-widest">{req.department}</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">{req.requesterName}</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">Vendor: {req.vendorName || "General"}</p>
                      </div>
                    </div>
                    <button onClick={() => handleOpenVetting(req)} className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:bg-[#A67C52] transition-all">REVIEW REQUEST</button>
                  </div>
                );
              })}
              {filterList(requisitions).length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
                  <p className="text-gray-300 font-black tracking-[0.4em] text-xs uppercase underline decoration-[#A67C52] decoration-2 underline-offset-8">No records currently pending</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <RequisitionHistory requisitions={filterList(history)} />
          )}

          {activeTab === 'all' && (
            <>
              {filterList(allDepartments).map(req => {
                const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
                const standardCurrency = getStandardCurrency(req.currency);

                return (
                  <div key={req._id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 bg-[#FBF9F6] rounded-2xl flex flex-col items-center justify-center border border-gray-50 px-2 text-center">
                        <span className="text-[8px] font-black text-[#A67C52]">{standardCurrency}</span>
                        <span className="text-sm font-black text-gray-800">{cleanedAmount.toLocaleString('en-US')}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                            req.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                            req.status === 'Declined' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                          }`}>{req.status}</span>
                          <span className="bg-gray-100 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">STAGE: {req.currentStage}</span>
                          <span className="text-gray-400 font-bold text-[9px] tracking-widest">{req.department}</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">{req.requesterName}</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">Vendor: {req.vendorName || "General"}</p>
                      </div>
                    </div>
                    <button onClick={() => handleOpenVetting(req)} className="w-full md:w-auto bg-gray-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:bg-[#A67C52] transition-all">VIEW</button>
                  </div>
                );
              })}
              {filterList(allDepartments).length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
                  <p className="text-gray-300 font-black tracking-[0.4em] text-xs uppercase underline decoration-[#A67C52] decoration-2 underline-offset-8">No enterprise files captured</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* --- PROCESS / REVIEW MODAL --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">
                    {activeTab === 'all' ? 'Archive File Record' : 'FC Review'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-5 tracking-widest uppercase tracking-[0.2em]">Analyzing ID: #{selectedReq._id.slice(-6)}</p>
                </div>
                <button onClick={handleCloseModal} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">✕</button>
              </div>

              {/* ROW 1: CORE DATA */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Requester</p>
                  <p className="text-xs font-black text-gray-800 truncate">{selectedReq.requesterName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Dept</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.department}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Due Date</p>
                  <p className="text-xs font-black text-red-500">{new Date(selectedReq.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Value</p>
                  <p className="text-xs font-black text-[#A67C52]">
                    {getStandardCurrency(selectedReq.currency)} {parseFloat(String(selectedReq.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ROW 2: NEW FIELDS + ACCOUNT DETAILS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">P.O Number</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.poNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">DA Ref No</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.daRefNo || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Payment Status</p>
                  <p className={`text-xs font-black ${selectedReq.paymentStatus === 'Paid' || selectedReq.clientPaymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                    {selectedReq.paymentStatus || selectedReq.clientPaymentStatus || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-[#A67C52]/30">
                  <p className="text-[9px] font-black text-[#A67C52] mb-1 uppercase tracking-widest">Account Details</p>
                  <p className="text-[10px] font-bold text-white break-words leading-tight">
                    {selectedReq.beneficiaryDetails || selectedReq.accountDetails || 'NOT PROVIDED'}
                  </p>
                </div>
              </div>

              <div className="space-y-6 mb-10 text-left">
                <div className="bg-[#FBF9F6] p-6 rounded-3xl border border-gray-100 shadow-inner">
                  <p className="text-[9px] font-black text-gray-300 mb-2 uppercase tracking-widest italic">Description of Need</p>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">"{selectedReq.requestNarrative || selectedReq.description}"</p>
                </div>

                {getHODComment(selectedReq.approvalHistory) && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-3xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600 mb-2 uppercase tracking-[0.2em]">HOD Approval Remarks</p>
                    <p className="text-[11px] font-bold text-gray-700 italic leading-relaxed">
                      "{getHODComment(selectedReq.approvalHistory)}"
                    </p>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-2 bg-gray-50 overflow-hidden">
                   <div className="flex justify-between items-center mb-2 mt-4 px-6">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Audit Evidence Preview</p>
                   </div>
                  <div className="w-full bg-white rounded-[2rem] p-4 min-h-[400px]">
                    <AttachmentViewer url={selectedReq.attachmentUrl} />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4 text-left">
                <p className="text-[9px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                  {activeTab === 'all' ? 'Append Internal Audit Note (Keeps stage unchanged)' : 'FC Vetting Remarks (Visible to MD)'}
                </p>
                <textarea 
                  value={fcComment}
                  onChange={(e) => setFcComment(e.target.value)}
                  placeholder={activeTab === 'all' ? "Add audit notes or remarks here..." : "Verify budget line..."}
                  className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-[2.5rem] p-6 text-xs font-bold outline-none focus:border-[#A67C52] focus:bg-white transition-all mb-6"
                />
                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => handleAction(selectedReq._id, 'Approved')} className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                    {activeTab === 'all' ? 'LOG VIEW COMMENT' : 'FORWARD TO MD'}
                  </button>
                  {activeTab !== 'all' && (
                    <button onClick={() => handleAction(selectedReq._id, 'Declined')} className="flex-1 bg-white border-2 border-red-50 text-red-400 py-5 rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-red-50 transition-all active:scale-95">
                      DECLINE REQUEST
                    </button>
                  )}
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
