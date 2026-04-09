import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELDBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

function RequisitionForm() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';

  // 1. Get user data safely
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [formData, setFormData] = useState({
    requestOption: 'New',
    requestType: 'Internal Operation/Request',
    clientName: 'N/A',
    otherClient: 'N/A',
    procurementType: 'Direct Procurement',
    vendorName: '',
    otherVendor: 'N/A',
    modeOfPayment: 'Transfer',
    beneficiaryDetails: '',
    currency: 'NGN',
    otherCurrency: 'N/A',
    amount: '',
    amountInWords: '',
    dueDate: '',
    requestNarrative: '',
    department: user?.dept || user?.department || '',
    hodForApproval: '',
    requesterName: user?.name || '',
    requesterEmail: user?.email || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 2. Critical: Freshly retrieve ID and Email to prevent "Required" errors
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const requesterId = currentUser?.id || currentUser?._id;
    const requesterEmail = currentUser?.email;

    if (!requesterId || !requesterEmail) {
      alert("❌ Error: User session invalid. Please log out and log back in.");
      setLoading(false);
      return;
    }

    const data = new FormData();

    // 3. Manually append required validation fields first
    data.append('requester', requesterId);
    data.append('requesterEmail', requesterEmail);
    data.append('requesterName', currentUser?.name || 'Staff');

    // 4. Append the rest of the form fields
    Object.keys(formData).forEach(key => {
      // Avoid duplicating the fields we just manually added
      if (!['requesterName', 'requesterEmail'].includes(key)) {
        if (key === 'amount') {
          data.append(key, Number(formData[key]));
        } else {
          data.append(key, formData[key] || 'N/A');
        }
      }
    });

    if (file) data.append('document', file);

    try {
      await axios.post(`${API_BASE_URL}/requisitions/submit`, data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      alert("✅ REQUISITION SUBMITTED SUCCESSFULLY");
      window.location.reload(); 
    } catch (err) {
      console.error("Full Error Object:", err.response?.data);
      const serverError = err.response?.data?.error || err.response?.data?.message || "Submission Failed";
      alert(`❌ ${serverError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#A67C52] p-10 text-white flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">BRICKS REQUISITION</h1>
            <p className="text-orange-100 text-[10px] font-bold mt-2 uppercase tracking-widest opacity-80">Portal v2.0</p>
          </div>
          <div className="text-right">
             <p className="font-black text-xs uppercase">{user?.name || "User"}</p>
             <button onClick={() => {localStorage.clear(); window.location.href='/'}} className="mt-2 text-[9px] uppercase font-black bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-red-500 transition-all">Sign Out</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Requester Name</label>
              <input type="text" value={formData.requesterName} readOnly className="bg-white border-b-2 p-3 font-bold text-sm text-gray-400 outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Department</label>
              <select name="department" required className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm" onChange={handleInputChange} value={formData.department}>
                <option value="">Select Dept</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Option</label>
              <select name="requestOption" className="bg-gray-50 border-b-2 p-3 outline-none font-bold text-sm" onChange={handleInputChange}>
                <option value="New">New Requisition</option>
                <option value="Paid">Previously Paid</option>
              </select>
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Approving HOD</label>
              <select name="hodForApproval" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm" onChange={handleInputChange}>
                <option value="">Select HOD Email</option>
                {HOD_EMAILS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-orange-50/20 p-8 rounded-[2rem] border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Client</label>
              <select name="clientName" className="bg-white border-b-2 p-3 outline-none font-bold text-sm" onChange={handleInputChange}>
                <option value="N/A">Internal / General</option>
                {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formData.clientName === 'Others' && (
                <input name="otherClient" placeholder="Specify Client" className="mt-2 border-b p-2 text-xs italic" onChange={handleInputChange} />
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Vendor</label>
              <select name="vendorName" required className="bg-white border-b-2 p-3 outline-none font-bold text-sm" onChange={handleInputChange}>
                <option value="">Choose Vendor</option>
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {formData.vendorName === 'OTHERS' && (
                <input name="otherVendor" placeholder="Specify Vendor" className="mt-2 border-b p-2 text-xs italic" onChange={handleInputChange} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Amount</label>
              <input name="amount" type="number" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-black text-2xl text-[#A67C52]" onChange={handleInputChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Required Date</label>
              <input name="dueDate" type="date" required className="bg-gray-50 border-b-2 p-3 outline-none font-bold text-sm" onChange={handleInputChange} />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Amount in Words</label>
            <input name="amountInWords" type="text" required placeholder="e.g. Ten Thousand Naira Only" className="bg-gray-50 border-b-2 p-3 outline-none font-bold text-sm italic" onChange={handleInputChange} />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Beneficiary Details</label>
            <input name="beneficiaryDetails" type="text" required placeholder="Account Name, Number, Bank" className="bg-gray-50 border-b-2 p-3 outline-none font-bold text-sm" onChange={handleInputChange} />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Narrative</label>
            <textarea name="requestNarrative" required className="w-full border-2 border-gray-50 p-6 rounded-[2rem] outline-none focus:border-[#A67C52] bg-gray-50 font-bold text-sm" rows="3" onChange={handleInputChange}></textarea>
          </div>

          <div className="bg-[#A67C52]/5 border-2 border-dashed border-[#A67C52]/20 p-10 rounded-[2.5rem] text-center">
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileChange} required />
              <div className="inline-block bg-white px-8 py-3 rounded-xl shadow-sm border border-orange-100 text-sm font-black text-[#A67C52]">
                {file ? `📎 ${file.name}` : "Upload Support Document"}
              </div>
            </label>
          </div>

          <button disabled={loading} className={`w-full py-6 rounded-[2rem] font-black uppercase text-white shadow-2xl transition-all ${loading ? 'bg-gray-400' : 'bg-[#A67C52] hover:bg-black active:scale-95'}`}>
            {loading ? 'Transmitting...' : 'Submit Requisition'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default RequisitionForm;
