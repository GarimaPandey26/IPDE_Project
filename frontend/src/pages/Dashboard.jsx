import React, { useEffect, useState } from 'react';
import { getComponents } from '../services/api';
import CreateComponentModal from '../components/CreateComponentModal';
import ConnectComponentModal from '../components/ConnectComponentModal';

const Dashboard = ({ onNavigate }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const data = await getComponents();
      setComponents(data);
    } catch (err) {
      setError('Failed to fetch components. Is backend server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h2>System Dashboard</h2>
          <p className="subtitle">Manage hardware components, verify system layout and track versions.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setIsConnectOpen(true)}>
            <span className="btn-icon">🔗</span> Link Components
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <span className="btn-icon">+</span> Add Component
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading components...</div>
      ) : components.length === 0 ? (
        <div className="empty-state">
          <h3>No Components Found</h3>
          <p>Get started by creating your first component (e.g. Radar Antenna).</p>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            Create Component
          </button>
        </div>
      ) : (
        <div className="components-grid">
          {components.map((comp) => {
            const latestData = comp.dataHistory && comp.dataHistory[0];
            return (
              <div key={comp._id} className="component-card">
                <div className="card-badge">{comp.type}</div>
                <h3 className="card-title">{comp.name}</h3>
                
                <div className="card-details">
                  <div className="detail-item">
                    <strong>Latest File:</strong>
                    <span className="file-info">
                      {latestData ? (
                        <>
                          <span className="version-pill">{latestData.version}</span>
                          <span className="file-name" title={latestData.fileName}>
                            {latestData.fileName}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">No files uploaded yet</span>
                      )}
                    </span>
                  </div>

                  <div className="detail-item">
                    <strong>Linked Elements ({comp.connectedComponents?.length || 0}):</strong>
                    <div className="connections-list">
                      {comp.connectedComponents && comp.connectedComponents.length > 0 ? (
                        comp.connectedComponents.map((conn) => (
                          <span key={conn._id} className="connection-tag">
                            {conn.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">Standalone Component</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-card btn-card-upload" 
                    onClick={() => onNavigate('upload', comp._id)}
                  >
                    Upload File
                  </button>
                  <button 
                    className="btn-card btn-card-history" 
                    onClick={() => onNavigate('history', comp._id)}
                  >
                    History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateComponentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onComponentCreated={fetchComponents}
      />
      <ConnectComponentModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        components={components}
        onComponentsConnected={fetchComponents}
      />
    </div>
  );
};

export default Dashboard;
