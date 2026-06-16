import React, { useEffect, useState } from 'react';
import { getVersionHistory } from '../services/api';

const VersionHistoryPage = ({ componentId, onNavigate, currentUser }) => {
  const [component, setComponent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!componentId) {
      setError('No component selected.');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getVersionHistory(componentId);
        setComponent(data.component);
        setHistory(data.history);
      } catch (err) {
        setError('Failed to load version history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [componentId]);

  if (loading) return <div className="loading-state">Loading history logs...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  // Access Control: Only the assigned manufacturer of this component can upload new versions
  const isAssigned = component && 
    currentUser.role === 'Manufacturer' && 
    currentUser.assignedComponent && 
    (currentUser.assignedComponent._id === componentId || currentUser.assignedComponent === componentId);

  const hasWriteAccess = currentUser.role === 'Admin' || isAssigned;

  return (
    <div className="history-container">
      <div className="page-header">
        <div>
          <h2>Version Lineage Tree</h2>
          <p className="subtitle">
            Component: <strong className="text-highlight">{component?.name}</strong> | Classification: <strong>{component?.category}</strong>
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            Back to Dashboard
          </button>
          {hasWriteAccess ? (
            <button className="btn btn-primary" onClick={() => onNavigate('upload', componentId)}>
              Upload New Version
            </button>
          ) : (
            <span className="read-only-badge">🔒 Read-Only History</span>
          )}
        </div>
      </div>

      <div className="history-content">
        <div className="lineage-description-card">
          <h4>Strict Temporal Ledger (T0 ➔ T1 ➔ T2 ➔ Tn)</h4>
          <p>
            Each document category maintains an independent chronological version chain. Below is the backward reference pointer chain demonstrating history integrity. 
            Older versions are never overwritten, satisfying compliance audit guidelines.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <h3>No Version Logs</h3>
            <p>This component does not have any files uploaded yet.</p>
            {hasWriteAccess && (
              <button className="btn btn-primary" onClick={() => onNavigate('upload', componentId)}>
                Upload First Version
              </button>
            )}
          </div>
        ) : (
          <div className="timeline-tree">
            {history.map((item, index) => {
              const uploadDate = new Date(item.uploadedAt).toLocaleString();
              const downloadUrl = `/api/components/download/${item._id}`;

              return (
                <div key={item._id} className="timeline-node">
                  <div className="timeline-marker">
                    <span className="version-bubble">{item.version}</span>
                    {index < history.length - 1 && <span className="timeline-line"></span>}
                  </div>

                  <div className="timeline-card">
                    <div className="timeline-card-header">
                      <div>
                        <h4>{item.fileName}</h4>
                        <span className="badge badge-manufacturer" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginTop: '0.25rem', display: 'inline-block' }}>
                          {item.category}
                        </span>
                      </div>
                      <span className="timestamp">{uploadDate}</span>
                    </div>

                    <div className="timeline-card-body">
                      <div className="meta-info">
                        <span><strong>Size:</strong> {(item.fileSize / 1024).toFixed(2)} KB</span>
                        <span><strong>Mime:</strong> {item.mimeType || 'unknown'}</span>
                        <span>Uploaded By: <strong className="text-highlight">{item.uploadedBy?.name || 'System'}</strong></span>
                      </div>

                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <strong>Change Description:</strong>
                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {item.changeDescription || 'No description provided.'}
                        </p>
                      </div>

                      <div className="chain-reference">
                        <span><strong>Pointer:</strong> <code>{item._id}</code></span>
                        {item.previousVersion ? (
                          <span className="parent-pointer">
                            <strong>Parent:</strong> <code>{item.previousVersion._id}</code> ({item.previousVersion.version} - {item.previousVersion.category})
                          </span>
                        ) : (
                          <span className="genesis-block">
                            <strong>Parent:</strong> <code>NULL</code> (Genesis Node for {item.category})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="timeline-card-actions">
                      <a 
                        href={downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-download"
                      >
                        📥 Download File
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistoryPage;
