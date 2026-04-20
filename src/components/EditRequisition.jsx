import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const VENDORS = ["RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELDBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

function EditRequisition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    requestNarrative: '',
    amount: '',
    vendorName: '',
    department: '',
    accountDetails: '',
    currency: 'NGN'
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    // 1. Session Check
    if (!token) {
      navigate('/');
      return;
    }

    const fetchRequisition = async () => {
      // 2. ID Validation to prevent "undefined" route hits
      if (!id || id === 'undefined') {
        toast.error("Invalid Request ID");
        navigate('/staff-dashboard');
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/requisitions/single/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          setFormData({
            requestNarrative: res.data.requestNarrative || res.data.description || '',
            amount: res.data.amount || res.data.totalAmount || '',
            vendorName: res.data.vendorName || '',
            department: res.data.department || res.data.dept || '',
            accountDetails: res.data.accountDetails || '',
            currency: res.data.currency || 'NGN'
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        // Only force logout on 401 Unauthorized
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate('/');
        } else {
          toast.error("Could not retrieve request data");
          setLoading(false);
        }
      }
    };

    fetchRequisition();
  }, [id, token, navigate, API_BASE_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const data = new FormData();
    data.append('requestNarrative', formData.requestNarrative);
    data.append('amount', formData.amount);
    data.append('vendorName', formData.vendorName);
    data.append('accountDetails', formData.accountDetails);
    data.append('currency', formData.currency);
    data.append('department', formData.department);
    
    if (file) data.append('document', file);

    try {
      await axios.put(`${API_BASE_URL}/requisitions/update/${id}`, data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      toast.success("REQUISITION UPDATED");
      // Redirect to staff dashboard to see the update
      navigate('/staff-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || "Update Failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A67C52]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 uppercase font-bold">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden border-t-[12px] border-[#A67C52]">
        <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h1 className="text-2xl font-black text-gray-900 italic tracking-tighter">Modify Request</h1>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Reference: {id?.slice(-8)}</p>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/staff-dashboard')} 
            className="h-10 w-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-xs font-black hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="flex flex-col">
            <label className="text-[9px] font-black text-gray-400 mb-2 tracking-widest italic uppercase">Narrative / Justification</label>
            <textarea name="requestNarrative" value={formData.requestNarrative} onChange={handleInputChange} className="bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent focus:border-[#A67C52] focus:bg-white outline-none font-bold text-sm transition-all" rows="4" required />
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-black text-[#A67C52] mb-2 tracking-widest italic uppercase">Payment Destination (Bank/Account)</label>
            <input type="text" name="accountDetails" value={formData.accountDetails} onChange={handleInputChange} placeholder="Bank Name, Account Number, Account Name" className="bg-black text-white p-6 rounded-[1.5rem] border-2 border-transparent focus:border-[#A67C52] outline-none font-bold text-xs transition-all shadow-inner" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-gray-400 mb-2 tracking-widest italic uppercase">Amount ({formData.currency})</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="bg-gray-50 p-5 rounded-2xl font-black text-xl text-[#A67C52] outline-none border-2 border-transparent focus:border-[#A67C52]" required />
            </div>
            
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-gray-400 mb-2 tracking-widest italic uppercase">Vendor</label>
              <select name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="bg-gray-50 p-5 rounded-2xl font-black text-[10px] outline-none border-2 border-transparent focus:border-[#A67C52]" required>
                <option value="">SELECT VENDOR</option>
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
             <label className="text-[9px] font-black text-gray-400 mb-4 block tracking-widest italic uppercase">Replace Attachment (Optional)</label>
             <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-[10px] font-black" />
          </div>

          <button type="submit" disabled={updating} className="w-full py-6 bg-black text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-[#A67C52] transition-all shadow-xl active:scale-95 disabled:opacity-50">
            {updating ? 'SYNCHRONIZING...' : 'UPDATE & RESUBMIT'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRequisition;
