import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["N/A", "Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["N/A", "RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

const DA_REFS = ["N/A", "BRICKS/OIS/C-MGT/0001/26", "BRICKS/PSA/TS/0002/26", "BRICKS/HML/SM-MVK/0003/26", "BRICKS/HML/SM-MVS/0004/26", "BRICKS/IKJP/RM/0005/26", "BRICKS/DW/SL/0006/26", "BRICKS/OP/SL/0007/26", "BRICKS/OIS/TS/0008/26", "BRICKS/HML/SL/0009/26", "BRICKS/OIS/CM/0010/26", "BRICKS/OIS/DS-CM/0011/26", "BRICKS/OIS/OT-CM/0012/26", "BRICKS/OIS/EX-CM/0013/26", "BRICKS/OIS/KD-CM/0014/26", "BRICKS/DRW/0015/26", "BRICKS/ARC/V-SEC/0016/26", "BRICKS/SCM/V-REG/0017/26", "BRICKS/SCM/VB/0018/26", "BRICKS/ARC/VS-STI/0019/26", "BRICKS/ARC/VS-ALS/0020/26", "BRICKS/SCM/CM/0021/26", "BRICKS/ARC/VS-RE/0022/26", "BRICKS/ARC/VS-TH/0023/26", "BRICKS/SCM/CM/0024/26", "BRICKS/SBS/TP/0025/26", "BRICKS/NSA/V-REG/0026/26", "BRICKS/ARC/VS-MTA/0027/26", "BRICKS/ARC/VS-HI/0028/26", "BRICKS/ARC/VS-TC/0029/26", "BRICKS/SCM/SM/0030/26", "BRICKS/AMANO/0031/26", "BRICKS/ARC/VS-MVC/0032/26", "BRICKS/NIMASA/TS-MTA/0033/26", "BRICKS/ARC/VS-PB/0034/26", "BRICKS/SCM/LOG/0035/26", "BRICKS/ARC/VS-PB/0036/26", "BRICKS/ARC/VS-AB/0037/26", "BRICKS/VS/0038/26", "BRICKS/PSA/PM/0039/26", "BRICKS/ARC/VS/0040/26", "BRICKS/OIS/PE/0041/26", "BRICKS/OP/V-REG/0042/26", "BRICKS/DS/V-REG/0043/26", "BRICKS/ARC/VS-MR/0044/26", "BRICKS/ARC/VS-XG/0045/26", "BRICKS/ARC/VS-STIM/0046/26", "BRICKS/ARC/VS-MVMC/0047/26", "BRICKS/ARC/VS-HP/0048/26", "BRICKS/ACSA/LS/0049/26", "BRICKS/NSA/TS/0050/26", "BRICKS/ARC/VS-CE/0051/26", "Bricks/ARC/VS-SE/0052/26", "BRICKS/ARC/VS-MC/0053/26", "BRICKS/ARC/VS-MVC/0054/26", "BRICKS/ARC/K9-MVC/0055/26", "BRICKS/ARC/VS-MTSA/0056/26", "BRICKS/UNP/PM/0057/26", "BRICKS/MRS/MS/0058/26", "BRICKS/ARC/VS-NE/0059/26", "BRICKS/TL/IWL/0060/26", "BRICKS/OIS/V-LOG/0061/26", "BRICKS/ARC/VS-CS/0062/26", "BRICK/DFSL/TS/0063/26", "BRICKS/ARC/VS /IWL/0064/26", "BRICKS/BTS/PF/0065/26", "BRICK/DFSL/VC/0066/26", "BRICKS/NSA/LOG/0067/26", "BRICKS/ESS/TS/0068/26", "BRICKS/OIS/OTV-REG/0069/26", "BRICKS/OIS/DSV-REG/0070/26", "BRICKS/ARC/VS-VO/0071/26", "BRICKS/PTML/MS/0072/26", "BRICKS/PCHS/MS/0073/26", "BRICKS/ARC/VS- GB/0074/26", "BRICKS/OIS/DEL/0075/26", "BRICKS/ARC/VS-MS/0076/26", "BRICKS/ARC/VS-BE/0077/26", "BRICKS/BMS/MS/0078/26", "BRICKS/ARC/VS-SB/0079/26", "BRICKS/OIS/DS-TS/0080/26", "BRICKS/RMS/TS/0081/26", "BRICK/PO/VC/0082/26", "BRICKS/SML/V-REG/0083/26", "BRICKS/HML/S-REG/0084/26", "BRICKS/SML/V-SEC/0085/26", "BRICKS/PHL/OPEX/0086/26", "BRICKS/NIMASA/PRJT/0087/26", "BRICKS/CGSL/V-REG/0089/26", "BRICKS/CP/JM/0090/26", "BRICKS/OS/LOG/0091/26", "BRICKS/FMCL/IWL/0092/26", "BRICKS/BAP/LOG/0093/26", "BRICKS/CGSL/SM/0094/26", "BRICKS/PSA/LOG/0095/26", "BRICKS/SEPLAT-SPY-P/LOG/0096/26", "BRICKS/VP/PFSS/0097/26", "BRICKS/ERDIS/TE-SM/0100/26", "BRICKS/ADMIN-OFF.EXP/01002/26", "BRICKS/ADM-INT.P/01003/26", "BRICKS/ADM-DOC-REN/01004/26", "BRICKS/ADM-DOC-REG/01005/26"];

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
    currentStage: 'HOD' 
  });

  const [displayAmount, setDisplayAmount] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, requesterEmail: user.email, department: user.department || user.dept || prev.department }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/[^0-9.]/g, '');
    const parts = rawValue.split('.');
    if (parts.length > 2) return;
    if (parts[0]) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue = parts.join('.');
    setDisplayAmount(formattedValue);
    setFormData(prev => ({ ...prev, amount: rawValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (file) data.append('document', file);

    try {
      await axios.post(`${API_BASE_URL}/requisitions/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert("✅ REQUISITION SUBMITTED TO HOD FOR APPROVAL");
      window.location.href = '/staff-dashboard'; 
    } catch (err) {
      alert(`❌ ${err.response?.data?.error || "Submission Failed"}`);
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
          </div>
          <button onClick={() => {localStorage.clear(); window.location.href='/'}} className="text-[9px] uppercase font-black bg-white/10 px-3 py-1.5 rounded-lg hover:bg-red-500">Sign Out</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          {/* ... (Keep existing form fields, ensuring they all use handleInputChange) ... */}
          {/* Example of specific field usage: */}
          <input type="text" name="poNumber" value={formData.poNumber} onChange={handleInputChange} placeholder="P.O Number" className="bg-white border-b-2 p-3 outline-none" />
          <select name="daRefNo" value={formData.daRefNo} onChange={handleInputChange}>{DA_REFS.map(ref => <option key={ref} value={ref}>{ref}</option>)}</select>
          {/* ... Submit button remains the same ... */}
        </form>
      </div>
    </div>
  );
}

export default RequisitionForm;
