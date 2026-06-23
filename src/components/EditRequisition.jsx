import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DEPARTMENTS, HOD_EMAILS } from '../utils/constants';

const CLIENTS = ["N/A", "Chairborne", "ERDIS", "Hadnuvo", "SouthCoast", "OIS", "Penguin PTE", "Bruhat Logistics", "Sangfroid", "BA Ports", "ARC", "GreenSwift", "Others"];
const VENDORS = ["N/A", "RICHE INTEGRATED TECHNOLOGY", "DAM JEDA SERVICES", "SCENTECH MECHANICAL SOLUTUION", "TECHRADAR", "PGOR GLOBAL SERVICES", "CABRIK MARINE", "FIELDBASE", "YUBATECH", "YEMOT GLOBAL", "JEMMATELIZ GLOBAL SERVICES", "ALADE MARINE SERVICES", "ECA OILFIELD & INDUSTRIAL SERVICES LTD", "A-Z TECHNICAL SOLUTION", "ROPETECH ENGINEERING SERVICES", "GRAFFINS GLOBAL SERVICES", "KADGO NIGERIA LIMITED", "MARINETECH SERVICES LIMITED", "VIC-DON INTERNATIONAL CO. LTD", "FARDEZZ INTEGRATED SERVICES", "MAJIMA LOGISTICS SERVICES", "OAK SAGE SERVICES", "VIVYKEN VENTURE", "MARSHALL SHIELD SERVICES", "MAXELO INTEGRATED SERVICS", "ONE MINE PLUMBING SERVICES", "TRAVICES NIGERIA LIMITED", "MANTRAC NIGERIA LIMITED", "USMAN STORES", "AEROPORT TRAVELS & TOURS LTD", "BLUWIN SERVICES", "OTHERS"];

const DA_REFS = ["N/A", "BRICKS/OIS/C-MGT/0001/26", "BRICKS/PSA/TS/0002/26", "BRICKS/HML/SM-MVK/0003/26", "BRICKS/HML/SM-MVS/0004/26", "BRICKS/IKJP/RM/0005/26", "BRICKS/DW/SL/0006/26", "BRICKS/OP/SL/0007/26", "BRICKS/OIS/TS/0008/26", "BRICKS/HML/SL/0009/26", "BRICKS/OIS/CM/0010/26", "BRICKS/OIS/DS-CM/0011/26", "BRICKS/OIS/OT-CM/0012/26", "BRICKS/OIS/EX-CM/0013/26", "BRICKS/OIS/KD-CM/0014/26", "BRICKS/DRW/0015/26", "BRICKS/ARC/V-SEC/0016/26", "BRICKS/SCM/V-REG/0017/26", "BRICKS/SCM/VB/0018/26", "BRICKS/ARC/VS-STI/0019/26", "BRICKS/ARC/VS-ALS/0020/26", "BRICKS/SCM/CM/0021/26", "BRICKS/ARC/VS-RE/0022/26", "BRICKS/ARC/VS-TH/0023/26", "BRICKS/SCM/CM/0024/26", "BRICKS/SBS/TP/0025/26", "BRICKS/NSA/V-REG/0026/26", "BRICKS/ARC/VS-MTA/0027/26", "BRICKS/ARC/VS-HI/0028/26", "BRICKS/ARC/VS-TC/0029/26", "BRICKS/SCM/SM/0030/26", "BRICKS/AMANO/0031/26", "BRICKS/ARC/VS-MVC/0032/26", "BRICKS/NIMASA/TS-MTA/0033/26", "BRICKS/ARC/VS-PB/0034/26", "BRICKS/SCM/LOG/0035/26", "BRICKS/ARC/VS-PB/0036/26", "BRICKS/ARC/VS-AB/0037/26", "BRICKS/VS/0038/26", "BRICKS/PSA/PM/0039/26", "BRICKS/ARC/VS/0040/26", "BRICKS/OIS/PE/0041/26", "BRICKS/OP/V-REG/0042/26", "BRICKS/DS/V-REG/0043/26", "BRICKS/ARC/VS-MR/0044/26", "BRICKS/ARC/VS-XG/0045/26", "BRICKS/ARC/VS-STIM/0046/26", "BRICKS/ARC/VS-MVMC/0047/26", "BRICKS/ARC/VS-HP/0048/26", "BRICKS/ACSA/LS/0049/26", "BRICKS/NSA/TS/0050/26", "BRICKS/ARC/VS-CE/0051/26", "Bricks/ARC/VS-SE/0052/26", "BRICKS/ARC/VS-MC/0053/26", "BRICKS/ARC/VS-MVC/0054/26", "BRICKS/ARC/K9-MVC/0055/26", "BRICKS/ARC/VS-MTSA/0056/26", "BRICKS/UNP/PM/0057/26", "BRICKS/MRS/MS/0058/26", "BRICKS/ARC/VS-NE/0059/26", "BRICKS/TL/IWL/0060/26", "BRICKS/OIS/V-LOG/0061/26", "BRICKS/ARC/VS-CS/0062/26", "BRICK/DFSL/TS/0063/26", "BRICKS/ARC/VS /IWL/0064/26", "BRICKS/BTS/PF/0065/26", "BRICK/DFSL/VC/0066/26", "BRICKS/NSA/LOG/0067/26", "BRICKS/ESS/TS/0068/26", "BRICKS/OIS/OTV-REG/0069/26", "BRICKS/OIS/DSV-REG/0070/26", "BRICKS/ARC/VS-VO/0071/26", "BRICKS/PTML/MS/0072/26", "BRICKS/PCHS/MS/0073/26", "BRICKS/ARC/VS- GB/0074/26", "BRICKS/OIS/DEL/0075/26", "BRICKS/ARC/VS-MS/0076/26", "BRICKS/ARC/VS-BE/0077/26", "BRICKS/BMS/MS/0078/26", "BRICKS/ARC/VS-SB/0079/26", "BRICKS/OIS/DS-TS/0080/26", "BRICKS/RMS/TS/0081/26", "BRICK/PO/VC/0082/26", "BRICKS/SML/V-REG/0083/26", "BRICKS/HML/S-REG/0084/26", "BRICKS/SML/V-SEC/0085/26", "BRICKS/PHL/OPEX/0086/26", "BRICKS/NIMASA/PRJT/0087/26", "BRICKS/CGSL/V-REG/0089/26", "BRICKS/CP/JM/0090/26", "BRICKS/OS/LOG/0091/26", "BRICKS/FMCL/IWL/0092/26", "BRICKS/BAP/LOG/0093/26", "BRICKS/CGSL/SM/0094/26", "BRICKS/PSA/LOG/0095/26", "BRICKS/SEPLAT-SPY-P/LOG/0096/26", "BRICKS/VP/PFSS/0097/26", "BRICKS/ERDIS/TE-SM/0100/26", "BRICKS/ADMIN-OFF.EXP/01002/26", "BRICKS/ADM-INT.P/01003/26", "BRICKS/ADM-DOC-REN/01004/26", "BRICKS/ADM-DOC-REG/01005/26"];

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
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 uppercase font-bold text-[10px]">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[3rem] overflow-hidden border-t-[12px] border-[#A67C52]">
        <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
          <h1 className="text-2xl font-black italic">Modify Request: {id?.slice(-8)}</h1>
          <button onClick={() => navigate('/staff-dashboard')} className="h-10 w-10 bg-white border rounded-full hover:bg-red-50">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select name="requestOption" value={formData.requestOption} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{["New", "Paid"].map(o => <option key={o} value={o}>{o}</option>)}</select>
            <select name="department" value={formData.department} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
            <select name="hodForApproval" value={formData.hodForApproval} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{HOD_EMAILS.map(h => <option key={h} value={h}>{h}</option>)}</select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select name="clientName" value={formData.clientName} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}</select>
            {formData.clientName === "Others" && <input name="otherClient" value={formData.otherClient} onChange={handleInputChange} placeholder="Specify Client" className="bg-gray-50 p-4 rounded-xl" />}
            <select name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{VENDORS.map(v => <option key={v} value={v}>{v}</option>)}</select>
            {formData.vendorName === "Others" && <input name="otherVendor" value={formData.otherVendor} onChange={handleInputChange} placeholder="Specify Vendor" className="bg-gray-50 p-4 rounded-xl" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <input name="poNumber" value={formData.poNumber} onChange={handleInputChange} placeholder="P.O Number" className="bg-gray-50 p-4 rounded-xl" />
             <input name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} placeholder="Invoice No" className="bg-gray-50 p-4 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select name="daRefNo" value={formData.daRefNo} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{DA_REFS.map(ref => <option key={ref} value={ref}>{ref}</option>)}</select>
            <select name="currency" value={formData.currency} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{["NGN", "USD", "EUR", "GBP", "Others"].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select name="clientPaymentStatus" value={formData.clientPaymentStatus} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl">{["N/A", "Paid", "Not-paid"].map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Amount" className="bg-gray-50 p-4 rounded-xl" />
            <input name="amountInWords" value={formData.amountInWords} onChange={handleInputChange} placeholder="Amount in Words" className="bg-gray-50 p-4 rounded-xl" />
          </div>

          <textarea name="beneficiaryDetails" value={formData.beneficiaryDetails} onChange={handleInputChange} placeholder="Beneficiary Details" className="bg-gray-50 p-4 rounded-xl w-full" />
          
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl w-full" />
          
          <textarea name="requestNarrative" value={formData.requestNarrative} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl w-full" placeholder="Narrative" />
          
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full bg-gray-50 p-4 rounded-xl" />

          <button type="submit" disabled={updating} className="w-full py-6 bg-black text-white rounded-[2rem] uppercase font-black hover:bg-[#A67C52]">
            {updating ? 'Updating...' : 'UPDATE & RESUBMIT'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRequisition;
