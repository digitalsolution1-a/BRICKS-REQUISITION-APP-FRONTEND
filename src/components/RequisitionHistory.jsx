import React from 'react';
import { useNavigate } from 'react-router-dom';

const RequisitionHistory = ({ requisitions }) => {
  const navigate = useNavigate();

  const isEditable = (status) => {
    const s = status?.toLowerCase();
    return s === 'pending' || s === 'declined' || s === 'rejected' || s === 'hod';
  };

  // Helper to find the last decline comment
  const getDeclineComment = (req) => {
    if (req.status?.toLowerCase() === 'declined' && req.approvalHistory?.length > 0) {
      const declineEntry = [...req.approvalHistory].reverse().find(e => e.action === 'Declined');
      return declineEntry?.comment;
    }
    return null;
  };

  const historyItems = Array.isArray(requisitions) ? requisitions.filter(req => 
    req.status?.toLowerCase() !== 'paid'
  ) : [];

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden mt-8">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <h2 className="text-gray-800 font-black text-sm tracking-widest uppercase italic">Request History & Queue</h2>
        <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
          {historyItems.length} Total Records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 text-[9px] font-black text-gray-400 tracking-[0.2em] uppercase">
            <tr>
              <th className="p-6">Description</th>
              <th className="p-6">Department</th>
              <th className="p-6">Amount</th>
              <th className="p-6">Current Location</th>
              <th className="p-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {historyItems.map((req) => {
              const declineComment = getDeclineComment(req);
              return (
                <tr key={req._id || req.id} className="hover:bg-gray-50/50 transition-colors uppercase">
                  <td className="p-6">
                    <p className="font-black text-gray-800 text-sm">
                      {req.title || req.requestNarrative || req.description}
                    </p>
                    <p className="text-[10px] text-gray-400 italic lowercase">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                    {/* NEW: Render comment if declined */}
                    {declineComment && (
                      <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-500 rounded">
                        <p className="text-[8px] font-black text-red-600">REJECTION REMARK:</p>
                        <p className="text-[9px] font-bold text-red-800 italic">"{declineComment}"</p>
                      </div>
                    )}
                  </td>
                  <td className="p-6 text-[10px] font-black text-gray-500">{req.dept || req.department}</td>
                  <td className="p-6 font-black text-gray-800 text-sm">
                    {req.currency || '₦'}{(req.amount || req.totalAmount)?.toLocaleString()}
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${
                      req.status?.toLowerCase() === 'declined' ? 'bg-red-100 text-red-600' :
                      req.currentStage === 'FC' ? 'bg-blue-100 text-blue-600' :
                      req.currentStage === 'MD' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {req.status?.toLowerCase() === 'pending' ? `PENDING: ${req.currentStage || 'PROCESSING'}` : req.status}
                    </span>
                  </td>
                  <td className="p-6">
                    {isEditable(req.status) && (
                      <button 
                        type="button"
                        onClick={() => navigate(`/edit-requisition/${req._id || req.id}`)}
                        className="bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black hover:bg-[#A67C52] transition-all shadow-md active:scale-90"
                      >
                        EDIT / RESUBMIT
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequisitionHistory;
