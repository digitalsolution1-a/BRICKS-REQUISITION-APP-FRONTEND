import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast'; // Highly recommended for better UX
import { DEPARTMENTS } from '../utils/constants';

const CLIENTS = ["Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
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
    beneficiaryDetails: '',
    currency: 'NGN'
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    // SECURITY CHECK: If no token, don't even try to fetch
    if (!token) {
      console.error("No token found, redirecting...");
      navigate('/');
      return;
    }

    const fetchRequisition = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/requisitions/single/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          setFormData(res.data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Session expired or invalid requisition ID");
        // DO NOT navigate('/') here if you want to stay logged in
        // navigate('/dashboard'); 
      }
    };

    if (id) fetchRequisition();
  }, [id, token, navigate, API_BASE_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const data = new FormData();
    
    // Logic to only append valid data
    Object.keys(formData).forEach(key => {
      // Avoid appending nested objects or null values that might break the backend
      if (key !== 'approvalHistory' && formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });
    
    if (file) data.append('document', file);

    try {
      await axios.put(`${API_BASE_URL}/requisitions/update/${id}`, data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      toast.success("REQUISITION UPDATED & RESUBMITTED");
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || "Update Failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <p className="text-xs font-black tracking-[0.4em] text-[#A67C52] animate-pulse uppercase">Syncing Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 uppercase">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden border-t-[12px] border-[#A67C52]">
        
        <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h1 className="text-2xl font-black text-gray-900 italic tracking-tighter">Edit Requisition</h1>
            <p className="text-[10px] font-bold text-gray-400 mt-1">Ref: #{id?.slice(-8)}</p>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/dashboard')} 
            className="h-10 w-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-xs font-black hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          <div className="flex flex-col">
            <label className="text-[9px] font-black text-gray-400 mb-2 tracking-widest italic">Narrative / Justification</label>
            <textarea 
              name="requestNarrative" 
              value={formData.requestNarrative || ''} 
              onChange={handleInputChange}
              placeholder="Explain the purpose of this request..."
              className="bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent focus:border-[#A67C52] focus:bg-white outline-none font-bold text-sm transition-all"
              rows="4"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-gray-400 mb-2 tracking-widest italic">Payable Amount ({formData.currency})</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount || ''} 
                onChange={handleInputChange}
                className="bg-gray-50 p-5 rounded-2xl font-black text-xl text-[#A67C52] outline-none border-2 border-transparent focus:border-[#A67C52]"
                required
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-gray-400 mb-2 tracking-widest italic">Beneficiary / Vendor</label>
              <select 
                name="vendorName" 
                value={formData.vendorName || ''} 
                onChange={handleInputChange}
                className="bg-gray-50 p-5 rounded-2xl font-black text-xs outline-none border-2 border-transparent focus:border-[#A67C52]"
                required
              >
                <option value="">SELECT VENDOR</option>
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
             <label className="text-[9px] font-black text-gray-400 mb-4 block tracking-widest italic">Update Supporting Document (Optional)</label>
             <input 
               type="file" 
               onChange={(e) => setFile(e.target.files[0])}
               className="text-[10px] font-black"
             />
             <p className="text-[8px] font-bold text-gray-400 mt-4 uppercase">Leave empty to keep existing attachment</p>
          </div>

          <button 
            type="submit" 
            disabled={updating}
            className="w-full py-6 bg-black text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-[#A67C52] transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {updating ? 'Processing...' : 'Update & Resubmit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRequisition;
