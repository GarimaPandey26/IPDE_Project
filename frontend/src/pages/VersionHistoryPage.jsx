import React, { useEffect, useState } from 'react';
import { getVersionHistory } from '../services/api';

const VersionHistoryPage = ({ componentId, onNavigate }) => {
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

  return (
    <div className="history-container">
      <div className="page-header">
        <div>
          <h2>Version Lineage Tree</h2>
          <p className="subtitle">
            Component: <strong className="text-highlight">{component?.name}</strong> | Type: <strong>{component?.type}</strong>
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            Back to Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('upload', componentId)}>
            Upload New Version
          </button>
        </div>
      </div>

      <div className="history-content">
        <div className="lineage-description-card">
          <h4>Strict No-Overwrite Ledger</h4>
          <p>
            Each upload creates a new node in the version history. Below is the active cryptographic-style linked chain.
            Each version retains a backward reference pointer to its parent version to guarantee historical integrity.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <h3>No Version Logs</h3>
            <p>This component does not have any files uploaded yet.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('upload', componentId)}>
              Upload First Version
            </button>
          </div>
        ) : (
          <div className="timeline-tree">
            {history.map((item, index) => {
              const uploadDate = new Date(item.uploadedAt).toLocaleString();
              // Using backend download API endpoint with relative routing
              const downloadUrl = `/api/components/download/${item._id}`;

              return (
                <div key={item._id} className="timeline-node">
                  <div className="timeline-marker">
                    <span className="version-bubble">{item.version}</span>
                    {index < history.length - 1 && <span className="timeline-line"></span>}
                  </div>

                  <div className="timeline-card">
                    <div className="timeline-card-header">
                      <h4>{item.fileName}</h4>
                      <span className="timestamp">{uploadDate}</span>
                    </div>

                    <div className="timeline-card-body">
                      <div className="meta-info">
                        <span><strong>Size:</strong> {(item.fileSize / 1024).toFixed(2)} KB</span>
                        <span><strong>Type:</strong> {item.mimeType || 'unknown'}</span>
                      </div>

                      <div className="chain-reference">
                        <span><strong>Pointer:</strong> <code>{item._id}</code></span>
                        {item.previousVersion ? (
                          <span className="parent-pointer">
                            <strong>Parent:</strong> <code>{item.previousVersion._id}</code> ({item.previousVersion.version})
                          </span>
                        ) : (
                          <span className="genesis-block">
                            <strong>Parent:</strong> <code>NULL</code> (Genesis Node)
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
