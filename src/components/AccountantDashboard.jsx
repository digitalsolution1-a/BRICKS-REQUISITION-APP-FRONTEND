import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RequisitionHistory from '../components/RequisitionHistory';
import AttachmentViewer from '../components/AttachmentViewer';

const AccountantDashboard = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [readyForFacList, setReadyForFacList] = useState([]);
  const [urgentList, setUrgentList] = useState([]);
  const [history, setHistory] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [view, setView] = useState('active'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null); 
  const [receiptFile, setReceiptFile] = useState(null);
  
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Currency normalizer helper
  const getStandardCurrency = (currencyStr) => {
    if (!currencyStr) return 'NGN';
    const c = String(currencyStr).trim().toUpperCase();
    if (c === '$' || c === 'USD' || c === 'DOLLAR' || c === 'US DOLLAR') return 'USD';
    if (c === '₦' || c === 'NGN' || c === 'NAIRA') return 'NGN';
    if (c === '€' || c === 'EUR' || c === 'EURO') return 'EUR';
    if (c === '£' || c === 'GBP' || c === 'POUND') return 'GBP';
    return c;
  };

  // --- HELPER: GET MD DISBURSEMENT INSTRUCTIONS ---
  const getMDInstructions = (historyArray) => {
    if (!historyArray || !Array.isArray(historyArray)) return "Standard disbursement approved.";
    const mdEntry = [...historyArray].reverse().find(h => h.actorRole === 'MD');
    return mdEntry ? mdEntry.comment : "Standard disbursement approved.";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!token) return navigate('/');

      const [queueRes, readyRes, urgentRes, historyRes, allDeptsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/ready-for-fac`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/urgent`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/history/ACCOUNTANT`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);
      
      const queueData = Array.isArray(queueRes.data) ? queueRes.data : [];
      const readyData = Array.isArray(readyRes.data) ? readyRes.data : [];
      const urgentData = Array.isArray(urgentRes.data) ? urgentRes.data : [];
      const historyData = Array.isArray(historyRes.data) ? historyRes.data : [];
      const allDeptsData = Array.isArray(allDeptsRes.data) ? allDeptsRes.data : [];

      setRequisitions(queueData);
      setReadyForFacList(readyData);
      setUrgentList(urgentData);
      setHistory(historyData);
      setAllDepartments(allDeptsData);

      const totalBadgeCount = queueData.length + readyData.length + urgentData.length;
      if ('setAppBadge' in navigator) {
        totalBadgeCount > 0 ? navigator.setAppBadge(totalBadgeCount) : navigator.clearAppBadge();
      }

    } catch (err) {
      console.error("Treasury Sync Error:", err);
      toast.error("Failed to sync treasury data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_BASE_URL, token]);

  const filterList = (list) => {
    const data = Array.isArray(list) ? list : [];
    if (!searchTerm) return data;
    return data.filter(req => 
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  // Calculate total amounts processed/paid matching MD authorization criteria
  const computeAccountantProcessedTotals = () => {
    const sourceList = Array.isArray(allDepartments) && allDepartments.length > 0 ? allDepartments : history;
    const processedList = sourceList.filter((req) => {
      const currentStatus = String(req.status || '').toUpperCase().trim();

      const isPaid = currentStatus === 'PAID' || currentStatus === 'DISBURSED' || currentStatus === 'COMPLETED';
      const isRejected = currentStatus.includes('DECLINED') || currentStatus.includes('REJECTED');
      if (!isPaid || isRejected) return false;

      const hasMDApproval = req.approvalHistory?.some((entry) => {
        const role = String(entry.actorRole || '').toUpperCase();
        const action = String(entry.action || '').toUpperCase();
        return role === 'MD' && (action === 'APPROVE' || action === 'APPROVED' || action === 'FORWARD');
      });

      return hasMDApproval;
    });

    return processedList.reduce(
      (acc, req) => {
        const currency = getStandardCurrency(req.currency);
        const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
        acc[currency] = (acc[currency] || 0) + cleanedAmount;
        return acc;
      },
      { NGN: 0, USD: 0, EUR: 0, GBP: 0 }
    );
  };

  const totalsByCurrency = computeAccountantProcessedTotals();

  const exportToCSV = () => {
    let dataToExport = [];
    if (view === 'active') dataToExport = requisitions;
    else if (view === 'ready') dataToExport = readyForFacList;
    else if (view === 'urgent') dataToExport = urgentList;
    else if (view === 'history') dataToExport = history;
    else dataToExport = allDepartments;

    const filteredData = filterList(dataToExport);
    if (filteredData.length === 0) return toast.error("No data to export");
    
    const headers = "ID,Date,Due Date,Requester,Dept,Vendor,PO Number,DA Ref,Beneficiary,Mode,Amount,Currency,Status,Narrative\n";
    
    const rows = filteredData.map(r => {
      const clean = (val) => (val ? String(val).replace(/,/g, ' ') : 'N/A');
      
      return [
        r._id,
        new Date(r.createdAt).toLocaleDateString(),
        new Date(r.dueDate).toLocaleDateString(),
        clean(r.requesterName),
        clean(r.department),
        clean(r.vendorName),
        clean(r.poNumber),
        clean(r.daRefNo),
        clean(r.beneficiaryDetails),
        clean(r.modeOfPayment),
        r.amount,
        r.currency,
        r.status,
        clean(r.requestNarrative || r.description)
      ].join(",");
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_Treasury_${view.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleMoveToReadyForFac = async (id) => {
    const loadingToast = toast.loading('Moving to Ready for Fac...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/action/${id}`, {
        action: 'ReadyForFac', 
        actorRole: 'ACCOUNTANT',
        actorName: user.name || 'Accounts Dept',
        comment: 'Processed - Ready for FAC'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("STAGE UPDATED TO READY FOR FAC", { id: loadingToast });
      setSelectedReq(null);
      fetchData();
    } catch (err) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  const handleMarkAsPaidWithReceipt = async (id) => {
    // Check if it's an IOU retirement or reconciliation request
    const isRetirement = selectedReq.requestType?.toLowerCase().includes('retirement') || 
                         selectedReq.requestType?.toLowerCase().includes('reconciliation') ||
                         selectedReq.requestNarrative?.toLowerCase().includes('retirement') ||
                         selectedReq.requestNarrative?.toLowerCase().includes('reconciliation');

    // If it's a regular payment disbursement and no receipt is attached, require it
    if (!isRetirement && !receiptFile) {
      return toast.error("Please attach the payment receipt file.");
    }

    const loadingToast = toast.loading(isRetirement ? 'Auditing retirement & completing...' : 'Uploading receipt & finalizing payment...');
    try {
      const formData = new FormData();
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }
      formData.append('action', 'Disburse');
      formData.append('actorRole', 'ACCOUNTANT');
      formData.append('actorName', user.name || 'Accounts Dept');
      formData.append('comment', isRetirement ? 'Retirement audited & reconciled' : 'Payment Disbursed and Receipt Attached');

      await axios.put(`${API_BASE_URL}/requisitions/mark-paid/${id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });

      toast.success(isRetirement ? "RETIREMENT COMPLETED & AUDITED" : "PAYMENT COMPLETED & RECEIPT ATTACHED", { id: loadingToast });
      setSelectedReq(null);
      setReceiptFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Payment finalization failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9]">
      <div className="animate-spin h-10 w-10 border-t-4 border-[#A67C52] border-solid rounded-full mb-4"></div>
      <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">Syncing Accounts...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F9] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#A67C52] rounded-xl flex items-center justify-center font-black text-xl italic text-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Treasury</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Accounts Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
            <button onClick={() => setView('active')} className={`px-3 py-2 rounded-lg text-[8px] font-black transition-all ${view === 'active' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>
              ACTIVE ({requisitions.length})
            </button>
            <button onClick={() => setView('ready')} className={`px-3 py-2 rounded-lg text-[8px] font-black transition-all ${view === 'ready' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>
              READY FOR FAC ({readyForFacList.length})
            </button>
            <button onClick={() => setView('urgent')} className={`px-3 py-2 rounded-lg text-[8px] font-black transition-all ${view === 'urgent' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
              URGENT ({urgentList.length})
            </button>
            <button onClick={() => setView('history')} className={`px-3 py-2 rounded-lg text-[8px] font-black transition-all ${view === 'history' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>
              HISTORY
            </button>
            <button onClick={() => setView('all')} className={`px-3 py-2 rounded-lg text-[8px] font-black transition-all ${view === 'all' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>
              ALL DEPTS ({allDepartments.length})
            </button>
          </div>
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg">
            <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</span>
          </button>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'AC'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user?.name || 'Accountant'}</h4>
            <p className="text-[9px] font-bold text-green-500 mt-2 tracking-widest">Account ACCESS: ACTIVE</p>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-center px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
            SIGN OUT
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6 mt-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
              Accounts <span className="text-[#A67C52]">Dashboard</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3 underline decoration-[#A67C52] decoration-2 underline-offset-4">
              Viewing: {view.toUpperCase()}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* NGN CARD */}
            <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-md border border-black min-w-[130px]">
              <p className="text-[7px] font-black text-[#A67C52] tracking-widest uppercase">Processed (NGN)</p>
              <p className="text-xs font-black tracking-tight mt-1">NGN {totalsByCurrency.NGN.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            {/* USD CARD */}
            <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-md border border-black min-w-[130px]">
              <p className="text-[7px] font-black text-[#A67C52] tracking-widest uppercase">Processed (USD)</p>
              <p className="text-xs font-black tracking-tight mt-1">USD ${totalsByCurrency.USD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            {/* EUR CARD */}
            <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-md border border-black min-w-[130px]">
              <p className="text-[7px] font-black text-[#A67C52] tracking-widest uppercase">Processed (EUR)</p>
              <p className="text-xs font-black tracking-tight mt-1">EUR €{totalsByCurrency.EUR.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            {/* GBP CARD */}
            <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-md border border-black min-w-[130px]">
              <p className="text-[7px] font-black text-[#A67C52] tracking-widest uppercase">Processed (GBP)</p>
              <p className="text-xs font-black tracking-tight mt-1">GBP £{totalsByCurrency.GBP.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>

            <input 
              type="text" 
              placeholder="SEARCH VENDOR OR REF..." 
              className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-bold flex-1 md:w-50 outline-none focus:border-[#A67C52] shadow-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={exportToCSV} className="bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A67C52] shadow-lg flex items-center gap-2">
              📥 EXPORT
            </button>
          </div>
        </div>

        {/* MOBILE NAV TABS */}
        <div className="flex xl:hidden bg-white p-2 rounded-2xl border border-gray-200 gap-1 mb-6 overflow-x-auto">
          <button onClick={() => setView('active')} className={`flex-1 py-2 px-3 whitespace-nowrap text-center rounded-lg text-[8px] font-black ${view === 'active' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>ACTIVE</button>
          <button onClick={() => setView('ready')} className={`flex-1 py-2 px-3 whitespace-nowrap text-center rounded-lg text-[8px] font-black ${view === 'ready' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>READY FOR FAC</button>
          <button onClick={() => setView('urgent')} className={`flex-1 py-2 px-3 whitespace-nowrap text-center rounded-lg text-[8px] font-black ${view === 'urgent' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>URGENT</button>
          <button onClick={() => setView('history')} className={`flex-1 py-2 px-3 whitespace-nowrap text-center rounded-lg text-[8px] font-black ${view === 'history' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>HISTORY</button>
          <button onClick={() => setView('all')} className={`flex-1 py-2 px-3 whitespace-nowrap text-center rounded-lg text-[8px] font-black ${view === 'all' ? 'bg-[#A67C52] text-black' : 'text-gray-400'}`}>ALL</button>
        </div>

        <div className="space-y-6">
          {/* ACTIVE QUEUE */}
          {view === 'active' && (
            <>
              {filterList(requisitions).map(req => (
                <div key={req._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[8px] font-black px-3 py-1 rounded-full tracking-widest bg-blue-100 text-blue-600">PENDING REVIEW</span>
                      <span className="text-gray-300 font-bold text-[9px] tracking-widest">#{req._id.slice(-6)}</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{req.vendorName || "General Requisition"}</h2>
                    <div className="flex gap-6 mt-2">
                       <p className="text-[10px] font-bold text-gray-500 underline underline-offset-4 decoration-[#A67C52]">{req.requesterName}</p>
                       <p className="text-[10px] font-bold text-gray-400">{req.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                        <p className="text-2xl font-black text-gray-900">{getStandardCurrency(req.currency)} {parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString()}</p>
                     </div>
                     <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] shadow-lg transition-all active:scale-95">
                       PROCESS REQUEST
                     </button>
                  </div>
                </div>
              ))}
              {filterList(requisitions).length === 0 && (
                <div className="py-32 text-center bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
                  <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs underline decoration-[#A67C52] decoration-2 underline-offset-8">No Active Requisitions</p>
                </div>
              )}
            </>
          )}

          {/* READY FOR FAC QUEUE */}
          {view === 'ready' && (
            <>
              {filterList(readyForFacList).map(req => (
                <div key={req._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[8px] font-black px-3 py-1 rounded-full tracking-widest bg-green-100 text-green-600">READY FOR FAC</span>
                      <span className="text-gray-300 font-bold text-[9px] tracking-widest">#{req._id.slice(-6)}</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{req.vendorName || "General Requisition"}</h2>
                    <div className="flex gap-6 mt-2">
                       <p className="text-[10px] font-bold text-gray-500 underline underline-offset-4 decoration-[#A67C52]">{req.requesterName}</p>
                       <p className="text-[10px] font-bold text-gray-400">{req.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                        <p className="text-2xl font-black text-gray-900">{getStandardCurrency(req.currency)} {parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString()}</p>
                     </div>
                     <button onClick={() => setSelectedReq(req)} className="bg-green-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black shadow-lg transition-all active:scale-95">
                       COMPLETE & AUDIT
                     </button>
                  </div>
                </div>
              ))}
              {filterList(readyForFacList).length === 0 && (
                <div className="py-32 text-center bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
                  <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs">No Items Ready for FAC</p>
                </div>
              )}
            </>
          )}

          {/* URGENT QUEUE */}
          {view === 'urgent' && (
            <>
              {filterList(urgentList).map(req => (
                <div key={req._id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border-2 border-red-200 hover:shadow-xl transition-all p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[8px] font-black px-3 py-1 rounded-full tracking-widest bg-red-100 text-red-600 animate-pulse">🚨 URGENT IMMEDIATE PAYMENT</span>
                      <span className="text-gray-300 font-bold text-[9px] tracking-widest">#{req._id.slice(-6)}</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{req.vendorName || "General Requisition"}</h2>
                    <div className="flex gap-6 mt-2">
                       <p className="text-[10px] font-bold text-gray-500 underline underline-offset-4 decoration-[#A67C52]">{req.requesterName}</p>
                       <p className="text-[10px] font-bold text-gray-400">{req.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                        <p className="text-2xl font-black text-gray-900">{getStandardCurrency(req.currency)} {parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString()}</p>
                     </div>
                     <button onClick={() => setSelectedReq(req)} className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-black shadow-lg transition-all active:scale-95">
                       FAST-TRACK PAYMENT
                     </button>
                  </div>
                </div>
              ))}
              {filterList(urgentList).length === 0 && (
                <div className="py-32 text-center bg-white border-4 border-dashed border-gray-100 rounded-[3rem]">
                  <p className="text-gray-300 font-black uppercase tracking-[0.4em] text-xs">No Urgent Requests</p>
                </div>
              )}
            </>
          )}

          {view === 'history' && (
            <RequisitionHistory requisitions={filterList(history)} />
          )}

          {view === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterList(allDepartments).map(req => (
                <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                        req.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                        req.status === 'Declined' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                      }`}>{req.status}</span>
                      <span className="bg-gray-100 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">STAGE: {req.currentStage || 'N/A'}</span>
                    </div>
                    <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                    <p className="text-base font-black text-[#A67C52] leading-none mt-1">{getStandardCurrency(req.currency)} {parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedReq({ ...req, isArchiveView: true })} className="bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">
                    VIEW
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* PROCESSING & RECEIPT MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">
                    {selectedReq.isArchiveView ? 'System Audit Record' : 'Treasury Processing & Execution'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-5 tracking-widest uppercase">
                    Reference ID: #{selectedReq._id.slice(-6)}
                  </p>
                </div>
                <button onClick={() => { setSelectedReq(null); setReceiptFile(null); }} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">✕</button>
              </div>

              {/* EXECUTIVE INSTRUCTION HIGHLIGHT */}
              <div className="bg-[#FBF9F6] border-2 border-[#A67C52] p-8 rounded-[2.5rem] mb-8 shadow-inner">
                <p className="text-[9px] font-black text-[#A67C52] uppercase tracking-[0.2em] mb-2 italic">MD's Payment Instructions:</p>
                <p className="text-lg font-black text-gray-800 italic leading-snug">
                  "{getMDInstructions(selectedReq.approvalHistory)}"
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase">Beneficiary</p>
                  <p className="text-[11px] font-bold text-gray-800 truncate">{selectedReq.beneficiaryDetails || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase">Mode</p>
                  <p className="text-[11px] font-bold text-gray-800">{selectedReq.modeOfPayment || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase">Due Date</p>
                  <p className="text-[11px] font-black text-red-500">{selectedReq.dueDate ? new Date(selectedReq.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase">Total Value</p>
                  <p className="text-[11px] font-black text-[#A67C52]">{getStandardCurrency(selectedReq.currency)} {parseFloat(String(selectedReq.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString()}</p>
                </div>
              </div>

              {/* ATTACHMENT VIEWER */}
              <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-2 bg-gray-50 mb-8">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest p-4">Proof of Obligation / Invoice</p>
                <div className="w-full bg-white rounded-[2rem] p-4 min-h-[250px]">
                  <AttachmentViewer url={selectedReq.attachmentUrl} />
                </div>
              </div>

              {/* RECEIPT UPLOAD SECTION (Optional for retirements/reconciliations) */}
              {!selectedReq.isArchiveView && (view === 'ready' || view === 'urgent' || selectedReq.currentStage === 'Ready for Fac') && (
                <div className="bg-orange-50/50 border-2 border-dashed border-[#A67C52]/40 p-6 rounded-[2rem] mb-8">
                  <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 block tracking-widest">
                    Upload Payment Receipt / Bank Teller (Optional for IOU Retirements / Reconciliations)
                  </label>
                  <input 
                    type="file" 
                    onChange={(e) => setReceiptFile(e.target.files[0])} 
                    className="w-full bg-white p-3 rounded-xl border text-xs font-bold"
                  />
                  {receiptFile && <p className="text-[9px] text-green-600 font-bold mt-2">Attached: {receiptFile.name}</p>}
                </div>
              )}

              {/* ACTION CONTROL BUTTONS */}
              <div className="flex gap-4">
                {selectedReq.isArchiveView ? (
                  <button onClick={() => setSelectedReq(null)} className="flex-1 bg-black text-white py-6 rounded-[2rem] text-[10px] font-black tracking-[0.3em] shadow-xl hover:bg-[#A67C52]">
                    CLOSE VIEW
                  </button>
                ) : view === 'active' ? (
                  <button onClick={() => handleMoveToReadyForFac(selectedReq._id)} className="flex-1 bg-black text-white py-6 rounded-[2rem] text-[10px] font-black tracking-[0.3em] shadow-xl hover:bg-[#A67C52]">
                    MOVE TO READY FOR FAC
                  </button>
                ) : (
                  <button onClick={() => handleMarkAsPaidWithReceipt(selectedReq._id)} className="flex-1 bg-green-600 text-white py-6 rounded-[2rem] text-[10px] font-black tracking-[0.3em] shadow-xl hover:bg-black">
                    COMPLETE & AUDIT PAYMENT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
