import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["N/A", "Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["N/A", "RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELDBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

function EditRequisition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [file, setFile] = useState(null);

  const [formData, setFormData] = useState({
    requestOption: 'New', requestType: '', procurementType: '', clientName: '', 
    otherClient: '', vendorName: '', otherVendor: '', poNumber: '', 
    daRefNo: 'N/A', invoiceNo: '', clientPaymentStatus: 'N/A', 
    modeOfPayment: 'Cash', beneficiaryDetails: '', currency: 'NGN', 
    otherCurrency: '', amount: '', amountInWords: '', dueDate: '', 
    requestNarrative: '', department: '', hodForApproval: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    const fetchRequisition = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/requisitions/single/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setFormData({
            ...res.data,
            dueDate: res.data.dueDate ? res.data.dueDate.split('T')[0] : ''
          });
        }
        setLoading(false);
      } catch (err) {
        toast.error("Error retrieving record");
        navigate('/staff-dashboard');
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
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('document', file);

    try {
      await axios.put(`${API_BASE_URL}/requisitions/resubmit/${id}`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success("REQUISITION UPDATED & RESUBMITTED");
      navigate('/staff-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || "Update Failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A67C52]"></div></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 uppercase font-bold">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden border-t-[12px] border-[#A67C52]">
        <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
          <h1 className="text-2xl font-black italic">Modify Request: {id?.slice(-8)}</h1>
          <button onClick={() => navigate('/staff-dashboard')} className="h-10 w-10 bg-white border rounded-full hover:bg-red-50">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {/* Add your full form fields here, mapping each to formData and handleInputChange */}
          {/* Example Input: */}
          <div className="flex flex-col">
            <label className="text-[9px] font-black text-gray-400 mb-2">Narrative</label>
            <textarea name="requestNarrative" value={formData.requestNarrative} onChange={handleInputChange} className="bg-gray-50 p-6 rounded-[2rem] w-full" rows="3" required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="bg-gray-50 p-5 rounded-2xl" placeholder="Amount" />
             <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="bg-gray-50 p-5 rounded-2xl" />
          </div>

          {/* ... Add other fields: Client, Vendor, HOD, etc. following this pattern ... */}

          <button type="submit" disabled={updating} className="w-full py-6 bg-black text-white rounded-[2rem] uppercase">
            {updating ? 'Updating...' : 'UPDATE & RESUBMIT'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRequisition;
