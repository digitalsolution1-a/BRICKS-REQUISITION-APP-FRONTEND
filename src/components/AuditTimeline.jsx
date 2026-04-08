import React from 'react';

const AuditTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200 text-center">
        <p className="text-gray-400 italic text-[10px] uppercase font-black tracking-widest">
          No history recorded in the manifest yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <h3 className="text-[10px] font-black text-[#A67C52] uppercase tracking-widest whitespace-nowrap">
          Approval Audit Trail
        </h3>
        <div className="h-[1px] w-full bg-orange-100"></div>
      </div>
      
      {/* Timeline Container */}
      <div className="relative border-l-2 border-dashed border-orange-100 ml-4 pl-8 space-y-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {history.map((entry, index) => (
          <div key={index} className="relative animate-in fade-in slide-in-from-left-4 duration-500">
            
            {/* Timeline Indicator Dot */}
            <div className={`absolute -left-[41px] w-5 h-5 rounded-full border-4 border-white shadow-md z-10 ${
              entry.action === 'Declined' || entry.action === 'Rejected' 
                ? 'bg-red-500' 
                : 'bg-green-500'
            }`} />
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-[#A67C52]/30 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                    {entry.actorName || "System Agent"}
                  </p>
                  {/* Actor Role: Themed to #A67C52 */}
                  <p className="text-[9px] font-bold text-[#A67C52] uppercase tracking-widest mt-0.5">
                    {entry.actorRole || "Authorized Personnel"}
                  </p>
                </div>
                <span className="text-[9px] font-bold text-gray-400 tabular-nums">
                  {new Date(entry.timestamp).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  entry.action === 'Declined' || entry.action === 'Rejected'
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : 'bg-green-50 text-green-600 border border-green-100'
                }`}>
                  {entry.action}
                </span>
              </div>

              {entry.comment && (
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                   <p className="text-[11px] text-gray-600 leading-relaxed italic font-medium">
                    "{entry.comment}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTimeline;