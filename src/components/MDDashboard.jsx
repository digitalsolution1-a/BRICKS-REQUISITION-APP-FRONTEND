import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MDDashboard = () => {
  const [inbox, setInbox] = useState([]); // Items at MD stage
  const [backlog, setBacklog] = useState([]); // Items at FC stage
  const [loading, setLoading] = useState(true);

  // Replace with actual API URL from your .env or config
  const API_BASE = "https://bricks-requisition-api.render.com/api/requisitions";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Fetches both MD and FC stages based on the backend logic we wrote
      const response = await axios.get(`${API_BASE}/pending/MD`);
      
      // Split the data into two columns
      setInbox(response.data.filter(item => item.currentStage === 'MD'));
      setBacklog(response.data.filter(item => item.currentStage === 'FC'));
    } catch (err) {
      console.error("Error fetching MD dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action, isOverride = false) => {
    const comment = prompt(isOverride ? "Enter reason for MD Override:" : "Enter approval comments:");
    
    if (comment === null) return; // Cancelled

    try {
      await axios.post(`${API_BASE}/action/${id}`, {
        action: action,
        comment: comment,
        actorRole: 'MD',
        actorName: 'Emmanuel Maiguwa', // Ideally from Auth context
        isOverride: isOverride
      });
      
      alert(isOverride ? "FC Bypassed! Requisition moved to Accounts." : "Approved successfully.");
      fetchRequests(); // Refresh data
    } catch (err) {
      alert("Error processing action. Check console.");
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center">⚓ Loading Maritime Dashboard...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#A67C52', textAlign: 'center' }}>MD Control Center</h1>
      <hr style={{ marginBottom: '30px', borderColor: '#eee' }} />

      <div style={{ display: 'flex', gap: '30px', minHeight: '70vh' }}>
        
        {/* COLUMN 1: MD APPROVALS */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '15px', border: '1px solid #ddd' }}>
          <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #A67C52', paddingBottom: '10px' }}>
             Standard Inbox <span style={{ fontSize: '0.6em', color: '#666' }}>(At MD Stage)</span>
          </h2>
          {inbox.length === 0 ? <p>No pending approvals for your stage.</p> : inbox.map(req => (
            <div key={req._id} style={cardStyle}>
              <h4>{req.vendorName}</h4>
              <p><strong>Requester:</strong> {req.requesterName}</p>
              <p><strong>Amount:</strong> {req.currency} {req.amount.toLocaleString()}</p>
              <button 
                onClick={() => handleAction(req._id, 'Approved', false)}
                style={approveBtnStyle}
              >
                Approve to Accounts
              </button>
            </div>
          ))}
        </div>

        {/* COLUMN 2: FC BACKLOG & OVERRIDE */}
        <div style={{ flex: 1, backgroundColor: '#fff5f5', padding: '20px', borderRadius: '15px', border: '1px solid #feb2b2' }}>
          <h2 style={{ color: '#c53030', borderBottom: '2px solid #c53030', paddingBottom: '10px' }}>
            FC Backlog <span style={{ fontSize: '0.6em', color: '#666' }}>(Override Control)</span>
          </h2>
          {backlog.length === 0 ? <p>FC is all caught up!</p> : backlog.map(req => (
            <div key={req._id} style={{ ...cardStyle, borderLeft: '5px solid #c53030' }}>
              <h4>{req.vendorName}</h4>
              <p><strong>Requester:</strong> {req.requesterName}</p>
              <p><strong>Amount:</strong> {req.currency} {req.amount.toLocaleString()}</p>
              <p style={{ color: '#c53030', fontSize: '12px' }}>⚠️ Stuck at FC Stage</p>
              <button 
                onClick={() => handleAction(req._id, 'Approved', true)}
                style={overrideBtnStyle}
              >
                Force Approve (Bypass FC)
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// --- STYLING ---
const cardStyle = {
  backgroundColor: '#fff',
  padding: '15px',
  borderRadius: '10px',
  marginBottom: '15px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  border: '1px solid #eee'
};

const approveBtnStyle = {
  backgroundColor: '#A67C52',
  color: 'white',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '10px'
};

const overrideBtnStyle = {
  backgroundColor: '#c53030',
  color: 'white',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '10px'
};

export default MDDashboard;
