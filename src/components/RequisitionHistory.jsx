import React from 'react';

const RequisitionHistory = ({ requisitions }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden mt-8">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <h2 className="text-gray-800 font-black text-sm tracking-widest uppercase italic">HOD Action History</h2>
        <span className="bg-[#A67C52] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
          {requisitions.length} Processed Records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">
            <tr>
              <th className="p-6">Description</th>
              <th className="p-6">Amount</th>
              <th className="p-6">Status</th>
              <th className="p-6">Your Remarks</th>
              <th className="p-6">Date Processed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requisitions.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-20 text-center font-black text-gray-300 text-xs uppercase">
                  No Action History Found
                </td>
              </tr>
            ) : (
              requisitions.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50/50 transition-colors uppercase">
                  <td className="p-6">
                    <p className="font-black text-gray-800 text-sm">
                      {req.requestNarrative || req.description}
                    </p>
                    <p className="text-[10px] text-gray-400 italic">
                      Staff: {req.requesterName}
                    </p>
                  </td>
                  <td className="p-6 font-black text-gray-800 text-sm">
                    {req.currency} {req.amount?.toLocaleString()}
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                      req.status?.toLowerCase() === 'declined' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {req.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-6 text-[10px] font-bold text-gray-600 max-w-[200px] truncate">
                    {req.comment || 'N/A'}
                  </td>
                  <td className="p-6 text-[10px] font-bold text-gray-400">
                    {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}
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
