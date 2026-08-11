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

      const [queueRes, historyRes, allDeptsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/requisitions/pending/ACCOUNTANT`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/requisitions/history/ACCOUNTANT`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/requisitions/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);
      
      setRequisitions(Array.isArray(queueRes.data) ? queueRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setAllDepartments(Array.isArray(allDeptsRes.data) ? allDeptsRes.data : []);

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      toast.error("Accountant portal sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  const filterList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(req => 
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req._id?.includes(searchTerm)
    );
  };

  // Calculate total amounts processed/paid by THIS SPECIFIC ACCOUNTANT
  const computeAccountantProcessedTotals = () => {
    const processedList = filterList(history).filter((req) => {
      const currentStatus = String(req.status || '').toUpperCase().trim();

      const isCurrentlyRejected = 
        currentStatus.includes('DECLINED') || 
        currentStatus.includes('REJECTED');

      if (isCurrentlyRejected) {
        return false;
      }

      const processedByThisUser = req.approvalHistory?.some((entry) => {
        const isPaidOrApproved = String(entry.action || '').toUpperCase() === 'PAID' || String(entry.action || '').toUpperCase() === 'APPROVED';
        const isAccountantRole = String(entry.actorRole || '').toUpperCase() === 'ACCOUNTANT' || String(entry.actorRole || '').toUpperCase() === 'FINANCE';
        
        const matchesUser = 
          (user.email && (entry.actorEmail === user.email || entry.email === user.email)) ||
          (user.name && (entry.actorName === user.name || entry.name === user.name)) ||
          (user._id && (entry.actorId === user._id || entry.userId === user._id));

        return isPaidOrApproved && isAccountantRole && (matchesUser || !user.email);
      });

      const directUserMatch = 
        (req.processedByEmail && req.processedByEmail === user.email) ||
        (req.accountantEmail && req.accountantEmail === user.email) ||
        (req.processedBy && req.processedBy === user.name) ||
        currentStatus === 'PAID';

      return processedByThisUser || directUserMatch;
    });

    return processedList.reduce(
      (acc, req) => {
        const currency = getStandardCurrency(req.currency);
        const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
        acc[currency] = (acc[currency] || 0) + cleanedAmount;
        return acc;
      },
      { NGN: 0, USD: 0 }
    );
  };

  const totalsByCurrency = computeAccountantProcessedTotals();

  const exportData = () => {
    let dataToExport = [];
    if (view === 'queue') dataToExport = filterList(requisitions);
    else if (view === 'history') dataToExport = filterList(history);
    else dataToExport = filterList(allDepartments);

    if (dataToExport.length === 0) return toast.error("No data to export");
    const headers = "Date,Department,Staff,Amount,Currency,Vendor,Status\n";
    const csv = dataToExport.map(r => {
      const cleanedAmount = parseFloat(String(r.amount || '0').replace(/[^0-9.]/g, '')) || 0;
      return `${new Date(r.createdAt).toLocaleDateString()},${r.department},${r.requesterName},${cleanedAmount},${getStandardCurrency(r.currency)},${r.vendorName || 'N/A'},${r.status}`;
    }).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bricks_Accountant_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleProcessPayment = async (id, paymentData) => {
    const loadingToast = toast.loading('Processing payment & updating records...');
    try {
      await axios.post(`${API_BASE_URL}/requisitions/pay/${id}`, {
        ...paymentData,
        actorRole: 'ACCOUNTANT',
        actorName: user.name || 'Accounts Department',
        actorEmail: user.email,
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("PAYMENT PROCESSED SUCCESSFULLY", { id: loadingToast });
      setSelectedReq(null);
      fetchData();
    } catch (err) {
      toast.error("Payment processing failed", { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin h-10 w-10 border-4 border-[#A67C52] border-t-transparent rounded-full mb-4"></div>
      <p className="text-[10px] font-black tracking-widest text-[#A67C52] uppercase">Syncing Accounts Portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB] uppercase">
      {/* NAVBAR */}
      <nav className="bg-black text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A67C52] rounded-lg flex items-center justify-center font-black">B</div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-[#A67C52]">Bricks Finance</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase italic">Accounts & Disbursement Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full border-2 border-[#A67C52] flex items-center justify-center bg-gray-900 shadow-lg active:scale-90 transition-all">
             <span className="text-[10px] font-black text-white">{user?.name?.substring(0,2).toUpperCase() || 'AC'}</span>
          </button>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed top-20 right-8 z-[60] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] mx-auto mb-3 flex items-center justify-center text-2xl font-black text-[#A67C52]">
              {user?.name?.substring(0,2).toUpperCase() || 'AC'}
            </div>
            <h4 className="text-sm font-black text-gray-900 leading-none">{user.name || 'Accountant'}</h4>
            <p className="text-[9px] font-bold text-[#A67C52] mt-2 tracking-widest">FINANCE DEPARTMENT</p>
          </div>
          <div className="space-y-2 border-t border-gray-50 pt-4">
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
              SIGN OUT
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic leading-none">ACCOUNTANT <span className="text-[#A67C52]">DASHBOARD</span></h2>
            <div className="flex gap-6 mt-6">
              <button onClick={() => setView('queue')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${view === 'queue' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>PAYMENT QUEUE ({requisitions.length})</button>
              <button onClick={() => setView('history')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${view === 'history' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>DISBURSEMENT HISTORY ({history.length})</button>
              <button onClick={() => setView('all')} className={`text-[10px] font-black tracking-widest pb-2 border-b-2 transition-all ${view === 'all' ? 'border-[#A67C52] text-black' : 'border-transparent text-gray-400'}`}>ALL DEPARTMENTS ({allDepartments.length})</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* NAIRA PROCESSED CARD */}
            <div className="bg-black text-white px-5 py-3 rounded-2xl shadow-md border border-black min-w-[150px]">
              <p className="text-[8px] font-black text-[#A67C52] tracking-widest uppercase">
                Processed By You (NGN)
              </p>
              <p className="text-xs font-black tracking-tight mt-1 text-white">
                NGN {totalsByCurrency.NGN.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* DOLLAR PROCESSED CARD */}
            <div className="bg-black text-white px-5 py-3 rounded-2xl shadow-md border border-black min-w-[150px]">
              <p className="text-[8px] font-black text-[#A67C52] tracking-widest uppercase">
                Processed By You (USD)
              </p>
              <p className="text-xs font-black tracking-tight mt-1 text-white">
                USD ${totalsByCurrency.USD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>

            <input 
              type="text" 
              placeholder="SEARCH RECORDS..." 
              className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:border-[#A67C52] shadow-sm flex-1 min-w-[180px]" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button onClick={exportData} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all shadow-lg">EXPORT CSV</button>
          </div>
        </div>

        {view === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <h3 className="text-[10px] font-black text-[#A67C52] tracking-[0.3em]">Authorized Payments Awaiting Disbursement</h3>
              <span className="bg-[#A67C52] text-white text-[8px] font-black px-2 py-0.5 rounded-full">{requisitions.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterList(requisitions).map(req => {
                const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
                const standardCurrency = getStandardCurrency(req.currency);

                return (
                  <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 mb-1">{req.department}</p>
                      <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                      <p className="text-lg font-black text-[#A67C52] leading-none mt-1">{standardCurrency} {cleanedAmount.toLocaleString('en-US')}</p>
                    </div>
                    <button onClick={() => setSelectedReq(req)} className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">
                      DISBURSE
                    </button>
                  </div>
                );
              })}
            </div>
            {requisitions.length === 0 && <p className="text-center py-20 text-gray-300 text-[10px] font-black italic underline decoration-[#A67C52] underline-offset-4">Payment queue empty</p>}
          </div>
        )}

        {view === 'history' && (
          <RequisitionHistory requisitions={filterList(history)} />
        )}

        {view === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterList(allDepartments).map(req => {
              const cleanedAmount = parseFloat(String(req.amount || '0').replace(/[^0-9.]/g, '')) || 0;
              const standardCurrency = getStandardCurrency(req.currency);

              return (
                <div key={req._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                        req.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                        req.status === 'Declined' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                      }`}>{req.status}</span>
                      <span className="text-gray-400 font-bold text-[8px] tracking-widest">{req.department}</span>
                    </div>
                    <h4 className="font-black text-gray-800 text-sm tracking-tight">{req.vendorName || req.requesterName}</h4>
                    <p className="text-base font-black text-[#A67C52] leading-none mt-1">{standardCurrency} {cleanedAmount.toLocaleString('en-US')}</p>
                  </div>
                  <button onClick={() => setSelectedReq({ ...req, isArchiveView: true })} className="bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#A67C52] transition-all">
                    VIEW
                  </button>
                </div>
              );
            })}
            {allDepartments.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-300 text-[10px] font-black italic">No historic files recorded</div>
            )}
          </div>
        )}
      </main>

      {selectedReq && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-[#A67C52] decoration-4 underline-offset-8">
                    {selectedReq.isArchiveView ? 'All Request Records' : 'Disbursement Execution'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase">
                    ID: #{selectedReq._id.slice(-6)} | DEPT: {selectedReq.department}
                  </p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
              </div>

              {/* MD INSTRUCTIONS BANNER */}
              <div className="mb-6 bg-amber-50 border-l-4 border-[#A67C52] p-6 rounded-r-[2rem] border border-amber-100">
                <p className="text-[9px] font-black text-[#A67C52] mb-1 uppercase tracking-[0.2em]">MD Authorization Instruction</p>
                <p className="text-[11px] font-bold text-gray-800 italic leading-relaxed">"{getMDInstructions(selectedReq.approvalHistory)}"</p>
              </div>

              {/* CORE METRICS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Amount</p>
                  <p className="text-xl font-black text-[#A67C52]">
                    {getStandardCurrency(selectedReq.currency)} {parseFloat(String(selectedReq.amount || '0').replace(/[^0-9.]/g, '')).toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">P.O Number</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.poNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">DA Ref No</p>
                  <p className="text-xs font-black text-gray-800">{selectedReq.daRefNo || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Status</p>
                  <p className="text-xs font-black text-orange-500">{selectedReq.status}</p>
                </div>
              </div>

              {/* BENEFICIARY DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Staff / Vendor</p>
                  <p className="text-[11px] font-black text-gray-800 uppercase">
                    {selectedReq.requesterName} {selectedReq.vendorName ? `→ ${selectedReq.vendorName}` : ''}
                  </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-[2rem] border border-[#A67C52]/30 text-white">
                  <p className="text-[9px] font-black text-[#A67C52] mb-1 uppercase tracking-widest">Account Details</p>
                  <p className="text-[10px] font-bold tracking-wider leading-relaxed">
                    {selectedReq.beneficiaryDetails || selectedReq.accountDetails || 'NOT SPECIFIED'}
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-4 bg-gray-50 overflow-hidden mb-8">
                <p className="text-[9px] font-black text-gray-400 mb-4 ml-2 uppercase tracking-widest">Supporting Documentation Preview</p>
                <div className="w-full bg-white rounded-[2rem] p-4 min-h-[300px]">
                  <AttachmentViewer url={selectedReq.attachmentUrl} />
                </div>
              </div>

              {!selectedReq.isArchiveView && (
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleProcessPayment(selectedReq._id, { paymentStatus: 'Paid' })}
                    className="flex-1 bg-[#A67C52] text-white py-5 rounded-[2rem] text-[10px] font-black tracking-widest shadow-xl shadow-[#A67C52]/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    MARK AS PAID / DISBURSED
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
