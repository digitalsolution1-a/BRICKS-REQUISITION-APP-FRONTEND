// Replace your existing <form> block in EditRequisition with this:

<form onSubmit={handleSubmit} className="p-10 space-y-8">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="flex flex-col">
      <label className="text-[9px] font-black text-gray-400 mb-2">Request Option</label>
      <select name="requestOption" value={formData.requestOption} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none">
        <option value="New">New</option>
        <option value="Paid">Previously Paid</option>
      </select>
    </div>
    <div className="flex flex-col">
      <label className="text-[9px] font-black text-gray-400 mb-2">Department</label>
      <select name="department" value={formData.department} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none">
        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
    <div className="flex flex-col">
      <label className="text-[9px] font-black text-gray-400 mb-2">HOD (Approver)</label>
      <select name="hodForApproval" value={formData.hodForApproval} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none">
        {HOD_EMAILS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="flex flex-col">
      <label className="text-[9px] font-black text-gray-400 mb-2">Client</label>
      <select name="clientName" value={formData.clientName} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none">
        {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
    <div className="flex flex-col">
      <label className="text-[9px] font-black text-gray-400 mb-2">Vendor</label>
      <select name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none">
        {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <input type="text" name="poNumber" value={formData.poNumber} onChange={handleInputChange} placeholder="P.O Number" className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none" />
    <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} placeholder="Invoice No" className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none" />
    <select name="clientPaymentStatus" value={formData.clientPaymentStatus} onChange={handleInputChange} className="bg-gray-50 p-4 rounded-xl border-b-2 outline-none">
      <option value="N/A">N/A</option>
      <option value="Paid">Paid</option>
      <option value="Not-paid">Not-paid</option>
    </select>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="Amount" className="bg-gray-50 p-5 rounded-2xl border-b-2 outline-none" />
    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="bg-gray-50 p-5 rounded-2xl border-b-2 outline-none" />
  </div>

  <div className="flex flex-col">
    <label className="text-[9px] font-black text-gray-400 mb-2">Request Narrative</label>
    <textarea name="requestNarrative" value={formData.requestNarrative} onChange={handleInputChange} className="bg-gray-50 p-6 rounded-[2rem] w-full border-b-2 outline-none" rows="3" required />
  </div>

  <div className="flex flex-col">
    <label className="text-[9px] font-black text-gray-400 mb-2">Update Supporting Document</label>
    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="bg-gray-50 p-4 rounded-xl" />
  </div>

  <button type="submit" disabled={updating} className="w-full py-6 bg-black text-white rounded-[2rem] uppercase font-black hover:bg-[#A67C52] transition-colors">
    {updating ? 'Updating...' : 'UPDATE & RESUBMIT'}
  </button>
</form>
