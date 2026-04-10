import React, { useState } from 'react';
import axios from 'axios';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELDBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

function RequisitionForm() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bricks-requisition-app-12.onrender.com/api';
  const user = JSON.parse(localStorage.getItem('user'));

  const [formData, setFormData] = useState({
    requester: user?._id || user?.id || '', 
    requesterName: user?.name || '', 
    requesterEmail: user?.email || '', 
    requestOption: 'New',
    requestType: 'Internal Operation/Request',
    clientName: '',
    otherClient: '',
    procurementType: 'Direct Procurement',
    vendorName: '',
    otherVendor: '',
    modeOfPayment: 'Cash',
    beneficiaryDetails: '', 
    currency: 'NGN',
    otherCurrency: '',
    amount: '',
    amountInWords: '',
    dueDate: '',
    requestNarrative: '',
    department: user?.dept || '',
    hodForApproval: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    
    // Explicitly append all text fields FIRST to ensure Multer processes them before the file
    data.append('requester', formData.requester);
    data.append('requesterName', formData.requesterName);
    data.append('requesterEmail', formData.requesterEmail || user?.email);
    data.append('department', formData.department);
    data.append('hodForApproval', formData.hodForApproval);
    data.append('requestOption', formData.requestOption);
    data.append('requestType', formData.requestType);
    data.append('procurementType', formData.procurementType);
    data.append('clientName', formData.clientName);
    data.append('otherClient', formData.otherClient);
    data.append('vendorName', formData.vendorName);
    data.append('otherVendor', formData.otherVendor);
    data.append('modeOfPayment', formData.modeOfPayment);
    data.append('beneficiaryDetails', formData.beneficiaryDetails || 'N/A');
    data.append('currency', formData.currency);
    data.append('otherCurrency', formData.otherCurrency);
    data.append('amount', formData.amount);
    data.append('amountInWords', formData.amountInWords);
    data.append('dueDate', formData.dueDate);
    data.append('requestNarrative', formData.requestNarrative);

    // Append file LAST
    if (file) data.append('document', file);

    const config = {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      }
    };

    try {
      await axios.post(`${API_BASE_URL}/requisitions/submit`, data, config);
      alert("✅ REQUISITION SUBMITTED SUCCESSFULLY");
      window.location.reload(); 
    } catch (err) {
      console.error("Payload Error:", err.response?.data);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || "Submission Failed";
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-[#A67C52] p-10 text-white flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">BRICKS REQUISITION FORM</h1>
            <p className="text-orange-100 text-[10px] font-bold mt-2 uppercase tracking-[0.2em] opacity-80">Requisition Portal</p>
          </div>
          <div className="text-right">
             <p className="font-black text-xs uppercase tracking-tight">{user?.name}</p>
             <button onClick={() => {localStorage.clear(); window.location.href='/'}} className="mt-2 text-[9px] uppercase font-black bg-white/10 px-3 py-1.5 rounded-lg hover:bg-red-500 transition-all border border-white/20">Sign Out</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          
          {/* Section 1: Staff Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Requester Name</label>
              <input 
                type="text" 
                name="requesterName" 
                value={formData.requesterName} 
                onChange={handleInputChange}
                required
                className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all"
                placeholder="Full Name"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Requester Email</label>
              <input 
                type="email" 
                name="requesterEmail" 
                value={formData.requesterEmail} 
                readOnly 
                className="bg-gray-100 border-b-2 p-3 outline-none font-bold text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Section 2: Core Routing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Request Option</label>
              <select name="requestOption" className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                <option value="New">New Requisition</option>
                <option value="Paid">Previously Paid</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Department</label>
              <select name="department" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange} value={formData.department}>
                <option value="">Select Dept</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Approving HOD</label>
              <select name="hodForApproval" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                <option value="">Select HOD</option>
                {HOD_EMAILS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-orange-50/30 p-8 rounded-[2rem] border border-orange-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Request Type</label>
                <select name="requestType" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  <option value="Internal Operation/Request">Internal Operation/Request</option>
                  <option value="Client Service Request">Client Service Request (Third-Party)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Procurement Type</label>
                <select name="procurementType" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  <option value="Direct Procurement">Direct Procurement</option>
                  <option value="Vendor Procurement">Vendor Procurement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Client Assignment</label>
                <select name="clientName" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  <option value="">N/A / Internal</option>
                  {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {formData.clientName === 'Others' && (
                  <input name="otherClient" placeholder="Enter Client Name" className="mt-3 bg-white border-b p-3 text-sm italic outline-none text-[#A67C52]" onChange={handleInputChange} required />
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Target Vendor</label>
                <select name="vendorName" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  <option value="">Choose Vendor</option>
                  {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {formData.vendorName === 'OTHERS' && (
                  <input name="otherVendor" placeholder="Enter Vendor Name" className="mt-3 bg-white border-b p-3 text-sm italic outline-none text-[#A67C52]" onChange={handleInputChange} required />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Payment Mode</label>
              <select name="modeOfPayment" className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                <option value="Cash">Petty Cash</option>
                <option value="Transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Currency</label>
              <select name="currency" className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                <option value="NGN">Naira (₦)</option>
                <option value="USD">Dollar ($)</option>
                <option value="OTHER">Other</option>
              </select>
              {formData.currency === 'OTHER' && (
                <input name="otherCurrency" placeholder="Specify Currency" className="mt-3 bg-gray-50 border-b p-3 text-sm outline-none" onChange={handleInputChange} required />
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Required Date</label>
              <input type="date" name="dueDate" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Amount (Value)</label>
              <input type="number" name="amount" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-black text-2xl text-[#A67C52]" onChange={handleInputChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Amount (In Words)</label>
              <input type="text" name="amountInWords" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm italic" placeholder="e.g. Five Thousand Naira Only" onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Beneficiary Details / Account info</label>
              <input 
                type="text" 
                name="beneficiaryDetails" 
                placeholder="Name, Bank, Account Number" 
                className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm" 
                onChange={handleInputChange} 
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Justification Narrative</label>
              <textarea name="requestNarrative" required className="w-full border-2 border-gray-50 p-6 rounded-[2rem] outline-none focus:border-[#A67C52] bg-gray-50 font-bold text-sm leading-relaxed" rows="4" placeholder="Detail the technical or operational need for this request..." onChange={handleInputChange}></textarea>
            </div>

            <div className="bg-[#A67C52]/5 border-2 border-dashed border-[#A67C52]/20 p-10 rounded-[2.5rem] text-center group hover:bg-[#A67C52]/10 transition-all">
              <label className="cursor-pointer">
                <p className="text-[10px] font-black text-[#A67C52] uppercase mb-3 tracking-widest">Supporting Documentation (Invoice/Receipt)</p>
                <input type="file" className="hidden" onChange={handleFileChange} required />
                <div className="inline-block bg-white px-8 py-3 rounded-xl shadow-sm border border-orange-100 text-sm font-black text-[#A67C52] group-hover:shadow-md transition-all">
                  {file ? `📎 ${file.name}` : "Browse Files or Drag & Drop"}
                </div>
              </label>
            </div>
          </div>

          <button 
            disabled={loading} 
            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#A67C52] hover:bg-black active:scale-95'
            }`}
          >
            {loading ? 'Syncing...' : '🚀 Submit Requisition'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default RequisitionForm;
