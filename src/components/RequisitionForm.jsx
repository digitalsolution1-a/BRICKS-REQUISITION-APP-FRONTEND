import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["N/A", "Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["N/A", "RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "Others"];

const DA_REFS = [
  "N/A", "BRICKS/OIS/C-MGT/0001/26", "BRICKS/CSR/0109/26", "BRICKS/SDSD-ML/SM/0107/26","BRICKS/PSA/PM/0039/26","BRICKS/MD-DRW/0015/26","BRICKS/NRS/TAX/0111/26","BRICKS/LIRS/TAX/0112/26","BRICKS/CSR/0109/26","BRICKS/ELGAN-OPS/0110/26","BRICKS/EKO-HB/0108/26", "BRICKS/PSA/TS/0002/26", "BRICKS/HML/SM-MVK/0003/26", "BRICKS/HML/SM-MVS/0004/26", "BRICKS/IKJP/RM/0005/26", "BRICKS/DW/SL/0006/26", "BRICKS/OP/SL/0007/26", "BRICKS/OIS/TS/0008/26", "BRICKS/HML/SL/0009/26", "BRICKS/OIS/CM/0010/26", "BRICKS/OIS/DS-CM/0011/26", "BRICKS/OIS/OT-CM/0012/26", "BRICKS/OIS/EX-CM/0013/26", "BRICKS/OIS/KD-CM/0014/26", "BRICKS/DRW/0015/26", "BRICKS/ARC/V-SEC/0016/26", "BRICKS/SCM/V-REG/0017/26", "BRICKS/SCM/VB/0018/26", "BRICKS/ARC/VS-STI/0019/26", "BRICKS/ARC/VS-ALS/0020/26", "BRICKS/SCM/CM/0021/26", "BRICKS/ARC/VS-RE/0022/26", "BRICKS/ARC/VS-TH/0023/26", "BRICKS/SCM/CM/0024/26", "BRICKS/SBS/TP/0025/26", "BRICKS/NSA/V-REG/0026/26", "BRICKS/ARC/VS-MTA/0027/26", "BRICKS/ARC/VS-HI/0028/26", "BRICKS/ARC/VS-TC/0029/26", "BRICKS/SCM/SM/0030/26", "BRICKS/AMANO/0031/26", "BRICKS/ARC/VS-MVC/0032/26", "BRICKS/NIMASA/TS-MTA/0033/26", "BRICKS/ARC/VS-PB/0034/26", "BRICKS/SCM/LOG/0035/26", "BRICKS/ARC/VS-PB/0036/26", "BRICKS/ARC/VS-AB/0037/26", "BRICKS/VS/0038/26", "BRICKS/PSA/PM/0039/26", "BRICKS/ARC/VS/0040/26", "BRICKS/OIS/PE/0041/26", "BRICKS/OP/V-REG/0042/26", "BRICKS/DS/V-REG/0043/26", "BRICKS/ARC/VS-MR/0044/26", "BRICKS/ARC/VS-XG/0045/26", "BRICKS/ARC/VS-STIM/0046/26", "BRICKS/ARC/VS-MVMC/0047/26", "BRICKS/ARC/VS-HP/0048/26", "BRICKS/ACSA/LS/0049/26", "BRICKS/NSA/TS/0050/26", "BRICKS/ARC/VS-CE/0051/26", "Bricks/ARC/VS-SE/0052/26", "BRICKS/ARC/VS-MC/0053/26", "BRICKS/ARC/VS-MVC/0054/26", "BRICKS/ARC/K9-MVC/0055/26", "BRICKS/ARC/VS-MTSA/0056/26", "BRICKS/UNP/PM/0057/26", "BRICKS/MRS/MS/0058/26", "BRICKS/ARC/VS-NE/0059/26", "BRICKS/TL/IWL/0060/26", "BRICKS/OIS/V-LOG/0061/26", "BRICKS/ARC/VS-CS/0062/26", "BRICK/DFSL/TS/0063/26", "BRICKS/ARC/VS /IWL/0064/26", "BRICKS/BTS/PF/0065/26", "BRICK/DFSL/VC/0066/26", "BRICKS/NSA/LOG/0067/26", "BRICKS/ESS/TS/0068/26", "BRICKS/OIS/OTV-REG/0069/26", "BRICKS/OIS/DSV-REG/0070/26", "BRICKS/ARC/VS-VO/0071/26", "BRICKS/PTML/MS/0072/26", "BRICKS/PCHS/MS/0073/26", "BRICKS/ARC/VS- GB/0074/26", "BRICKS/OIS/DEL/0075/26", "BRICKS/ARC/VS-MS/0076/26", "BRICKS/ARC/VS-BE/0077/26", "BRICKS/BMS/MS/0078/26", "BRICKS/ARC/VS-SB/0079/26", "BRICKS/OIS/DS-TS/0080/26", "BRICKS/RMS/TS/0081/26", "BRICK/PO/VC/0082/26", "BRICKS/SML/V-REG/0083/26", "BRICKS/HML/S-REG/0084/26", "BRICKS/SML/V-SEC/0085/26", "BRICKS/PHL/OPEX/0086/26", "BRICKS/NIMASA/PRJT/0087/26", "BRICKS/CGSL/V-REG/0089/26", "BRICKS/CP/JM/0090/26", "BRICKS/OS/LOG/0091/26", "BRICKS/FMCL/IWL/0092/26", "BRICKS/BAP/LOG/0093/26", "BRICKS/CGSL/SM/0094/26", "BRICKS/PSA/LOG/0095/26", "BRICKS/SEPLAT-SPY-P/LOG/0096/26", "BRICKS/VP/PFSS/0097/26", "BRICKS/ERDIS/TE-SM/0100/26", "BRICKS/ADMIN-OFF.EXP/01002/26", "BRICKS/ADM-INT.P/01003/26", "BRICKS/ADM-DOC-REN/01004/26", "BRICKS/ADM-DOC-REG/01005/26"];
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
    poNumber: '',
    daRefNo: 'N/A',
    invoiceNo: '', 
    clientPaymentStatus: 'N/A',
    modeOfPayment: 'Cash',
    beneficiaryDetails: '', 
    currency: 'NGN',
    otherCurrency: '',
    amount: '', 
    amountInWords: '',
    dueDate: '',
    requestNarrative: '',
    department: user?.department || user?.dept || '',
    hodForApproval: '', 
  });

  const [displayAmount, setDisplayAmount] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        requesterEmail: user.email,
        department: user.department || user.dept || prev.department
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/[^0-9.]/g, '');
    const parts = rawValue.split('.');
    if (parts.length > 2) return;
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    const formattedValue = parts.join('.');
    setDisplayAmount(formattedValue);
    setFormData(prev => ({ ...prev, amount: rawValue }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    
    // Explicit mapping to ensure backend schema matches
    data.append('requester', formData.requester);
    data.append('requesterName', formData.requesterName);
    data.append('requesterEmail', formData.requesterEmail);
    data.append('requestOption', formData.requestOption);
    data.append('requestType', formData.requestType);
    data.append('clientName', formData.clientName);
    data.append('otherClientDetails', formData.clientName === 'Others' ? formData.otherClient : '');
    data.append('procurementType', formData.procurementType);
    data.append('vendorName', formData.vendorName);
    data.append('otherVendorName', formData.vendorName === 'Others' ? formData.otherVendor : '');
    data.append('poNumber', formData.poNumber || 'N/A');
    data.append('daRefNo', formData.daRefNo || 'N/A');
    data.append('invoiceNo', formData.invoiceNo || 'N/A');
    data.append('clientPaymentStatus', formData.clientPaymentStatus);
    data.append('modeOfPayment', formData.modeOfPayment);
    data.append('beneficiaryDetails', formData.beneficiaryDetails);
    data.append('currency', formData.currency);
    data.append('amount', formData.amount);
    data.append('amountInWords', formData.amountInWords);
    data.append('dueDate', formData.dueDate);
    data.append('requestNarrative', formData.requestNarrative);
    data.append('department', formData.department);
    data.append('hodForApproval', formData.hodForApproval);
    data.append('currentStage', 'HOD');
    
    if (file) data.append('document', file);

    try {
      await axios.post(`${API_BASE_URL}/requisitions/submit`, data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      alert("✅ REQUISITION SUBMITTED TO HOD FOR APPROVAL");
      window.location.href = '/staff-dashboard'; 
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
        <div className="bg-[#A67C52] p-10 text-white flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">BRICKS REQUISITION</h1>
            <p className="text-orange-100 text-[10px] font-bold mt-2 uppercase tracking-[0.2em] opacity-80">Requisition Portal</p>
          </div>
          <div className="text-right">
             <p className="font-black text-xs uppercase tracking-tight">{user?.name}</p>
             <button onClick={() => {localStorage.clear(); window.location.href='/'}} className="mt-2 text-[9px] uppercase font-black bg-white/10 px-3 py-1.5 rounded-lg hover:bg-red-500 transition-all border border-white/20">Sign Out</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Requester Name</label>
              <input type="text" name="requesterName" value={formData.requesterName} onChange={handleInputChange} required className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" placeholder="Full Name" />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Requester Email</label>
              <input type="email" name="requesterEmail" value={formData.requesterEmail} readOnly className="bg-gray-100 border-b-2 p-3 outline-none font-bold text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Request Option</label>
              <select name="requestOption" value={formData.requestOption} className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
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
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">HOD (Approver)</label>
              <select name="hodForApproval" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all border-l-4 border-l-[#A67C52]" onChange={handleInputChange}>
                <option value="">Select HOD Email</option>
                {HOD_EMAILS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-orange-50/30 p-8 rounded-[2rem] border border-orange-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Request Type</label>
                <select name="requestType" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  <option value="N/A">N/A</option>
                  <option value="Internal Operation/Request">Internal Operation/Request</option>
                  <option value="Client Service Request">Client Service Request (Third-Party)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Procurement Type</label>
                <select name="procurementType" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  <option value="N/A">N/A</option>
                  <option value="Direct Procurement">Direct Procurement</option>
                  <option value="Vendor Procurement">Vendor Procurement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Client Assignment</label>
                <select name="clientName" value={formData.clientName} className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {formData.clientName === 'Others' && (
                  <input name="otherClient" value={formData.otherClient} placeholder="Enter Client Name" className="mt-3 bg-white border-b p-3 text-sm italic outline-none text-[#A67C52]" onChange={handleInputChange} required />
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Vendor</label>
                <select name="vendorName" value={formData.vendorName} className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                  {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {formData.vendorName === 'Others' && (
                  <input name="otherVendor" value={formData.otherVendor} placeholder="Enter Vendor Name" className="mt-3 bg-white border-b p-3 text-sm italic outline-none text-[#A67C52]" onChange={handleInputChange} required />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-orange-100/50">
              <div className="flex flex-col">
                  <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">P.O Number</label>
                  <input type="text" name="poNumber" value={formData.poNumber} placeholder="Optional" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange} />
              </div>
              <div className="flex flex-col">
                  <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Invoice No.</label>
                  <input type="text" name="invoiceNo" value={formData.invoiceNo} placeholder="Optional" className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange} />
              </div>
              <div className="flex flex-col">
                  <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">DA Ref No</label>
                  <select name="daRefNo" value={formData.daRefNo} className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                    {DA_REFS.map(ref => <option key={ref} value={ref}>{ref}</option>)}
                  </select>
              </div>
              <div className="flex flex-col">
                  <label className="text-[10px] font-black text-[#A67C52] uppercase mb-2 tracking-widest">Client Payment Status</label>
                  <select name="clientPaymentStatus" value={formData.clientPaymentStatus} className="bg-white border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                    <option value="N/A">N/A</option>
                    <option value="Paid">Paid</option>
                    <option value="Not-paid">Not-paid</option>
                  </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Payment Mode</label>
              <select name="modeOfPayment" className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm transition-all" onChange={handleInputChange}>
                <option value="Cash">Petty Cash</option>
                <option value="Transfer">Bank Transfer</option>
                <option value="Remita">Remita</option>
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
              <input type="text" name="amount" value={displayAmount} required placeholder="0.00" className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-black text-2xl text-[#A67C52]" onChange={handleAmountChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Amount (In Words)</label>
              <input type="text" name="amountInWords" required className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm italic" placeholder="e.g. Five Thousand Naira Only" onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Beneficiary Details / Account info</label>
              <input type="text" name="beneficiaryDetails" placeholder="Name, Bank, Account Number" className="bg-gray-50 border-b-2 p-3 outline-none focus:border-[#A67C52] font-bold text-sm" onChange={handleInputChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Request Narrative</label>
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

          <button disabled={loading} className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#A67C52] hover:bg-black active:scale-95'}`}>
            {loading ? 'Syncing...' : 'Submit Requisition'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RequisitionForm;
