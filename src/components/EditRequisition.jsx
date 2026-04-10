import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELDBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

function EditRequisition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 1. Fetch existing data on mount
  useEffect(() => {
    const fetchRequisition = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/requisitions/single/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setFormData(res.data);
        setLoading(false);
      } catch (err) {
        alert("Failed to load requisition data");
        navigate('/dashboard');
      }
    };
    fetchRequisition();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const data = new FormData();
    // Append all current formData keys
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) data.append(key, formData[key]);
    });
    
    if (file) data.append('document', file);

    try {
      await axios.put(`${API_BASE_URL}/requisitions/update/${id}`, data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      alert("✅ REQUISITION UPDATED & RESUBMITTED");
      navigate('/dashboard');
    } catch (err) {
      alert("❌ Update Failed: " + (err.response?.data?.error || "Server Error"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black">LOADING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-[#A67C52]">
        <div className="p-10 border-b flex justify-between items-center">
          <h1 className="text-2xl font-black text-gray-800 uppercase">Edit Requisition</h1>
          <button onClick={() => navigate('/dashboard')} className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Reuse your existing form inputs here, mapping to formData values */}
          {/* Example for one field: */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2">Request Narrative / Justification</label>
            <textarea 
              name="requestNarrative" 
              value={formData.requestNarrative} 
              onChange={handleInputChange}
              className="bg-gray-50 p-4 rounded-xl border-none outline-none focus:ring-2 ring-[#A67C52] font-bold text-sm"
              rows="4"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2">Amount</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleInputChange}
                className="bg-gray-50 p-4 rounded-xl font-black text-[#A67C52]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2">Vendor</label>
              <select 
                name="vendorName" 
                value={formData.vendorName} 
                onChange={handleInputChange}
                className="bg-gray-50 p-4 rounded-xl font-bold"
              >
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={updating}
            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#A67C52] transition-all"
          >
            {updating ? 'Updating...' : 'Save & Resubmit to HOD'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRequisition;
