import React from 'react';

const RequisitionHistory = ({ requisitions }) => {
  // Filter for everything that is NOT pending
  const historyItems = requisitions.filter(req => 
    req.status?.toLowerCase() === 'approved' || 
    req.status?.toLowerCase() === 'rejected' ||
    req.status?.toLowerCase() === 'completed'
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden mt-8">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <h2 className="text-gray-800 font-black text-sm tracking-widest uppercase italic">Transaction History</h2>
        <span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
          {historyItems.length} Archive Records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">
            <tr>
              <th className="p-6">Description</th>
              <th className="p-6">Department</th>
              <th className="p-6">Amount</th>
              <th className="p-6">Final Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {historyItems.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-20 text-center font-black text-gray-300 text-xs uppercase">
                  No Archived Records Found
                </td>
              </tr>
            ) : (
              historyItems.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50/50 transition-colors uppercase">
                  <td className="p-6">
                    <p className="font-black text-gray-800 text-sm">{req.title || req.description}</p>
                    <p className="text-[10px] text-gray-400 italic lowercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6 text-[10px] font-black text-gray-500">{req.dept || req.department}</td>
                  <td className="p-6 font-black text-gray-800 text-sm">₦{req.totalAmount?.toLocaleString()}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                      req.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequisitionHistory;
