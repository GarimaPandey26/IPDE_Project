import React, { useEffect, useState } from 'react';
import { getVersionHistory } from '../services/api';

const VersionComparePage = ({ componentId, versionAId, versionBId, onNavigate, currentUser }) => {
  const [component, setComponent] = useState(null);
  const [versionA, setVersionA] = useState(null);
  const [versionB, setVersionB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!componentId || !versionAId || !versionBId) {
      setError('Please select exactly two versions from history to compare.');
      setLoading(false);
      return;
    }

    const fetchVersions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getVersionHistory(componentId);
        setComponent(data.component);
        
        const fileA = data.history.find(h => h._id === versionAId);
        const fileB = data.history.find(h => h._id === versionBId);

        if (!fileA || !fileB) {
          setError('One or both of the selected versions could not be found.');
        } else {
          // Sort so versionA is the older/lower version, B is newer
          if (fileA.versionNumber > fileB.versionNumber) {
            setVersionA(fileB);
            setVersionB(fileA);
          } else {
            setVersionA(fileA);
            setVersionB(fileB);
          }
        }
      } catch (err) {
        setError('Failed to load version history for comparison.');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [componentId, versionAId, versionBId]);

  if (loading) return <div className="loading-state">Loading version comparisons...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const sizeDiff = versionB.fileSize - versionA.fileSize;
  const sizeDiffKb = (sizeDiff / 1024).toFixed(2);

  return (
    <div className="compare-container">
      <div className="page-header">
        <div>
          <h2>Document Version Comparison</h2>
          <p className="subtitle">
            Component: <strong className="text-highlight">{component?.name}</strong> | Category: <strong>{versionA.category}</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('history', componentId)}>
          Back to Version History
        </button>
      </div>

      <div className="lineage-description-card" style={{ borderColor: 'var(--primary)', borderLeftWidth: '4px' }}>
        <h4>Audit Delta Summary</h4>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Comparing <strong>{versionA.version}</strong> (Older) and <strong>{versionB.version}</strong> (Newer).
          {sizeDiff === 0 ? (
            ' File sizes are identical.'
          ) : sizeDiff > 0 ? (
            <span> File size increased by <strong className="diff-highlight">{sizeDiffKb} KB</strong> (+{((sizeDiff / versionA.fileSize) * 100).toFixed(1)}%).</span>
          ) : (
            <span> File size decreased by <strong className="diff-positive">{Math.abs(sizeDiffKb)} KB</strong> ({((sizeDiff / versionA.fileSize) * 100).toFixed(1)}%).</span>
          )}
          {versionA.uploadedBy?._id !== versionB.uploadedBy?._id && (
            <span> Responsibility handed over from <strong>{versionA.uploadedBy?.name}</strong> to <strong>{versionB.uploadedBy?.name}</strong>.</span>
          )}
        </p>
      </div>

      <div className="compare-grid animate-fade-in">
        {/* Version A Card (Older) */}
        <div className="compare-card">
          <div className="compare-header">
            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Older Release ({versionA.version})</h3>
            <span className="version-pill" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              Release Date: {new Date(versionA.uploadedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="compare-row">
            <strong>Filename:</strong>
            <span style={{ fontFamily: 'monospace' }}>{versionA.fileName}</span>
          </div>

          <div className="compare-row">
            <strong>File Size:</strong>
            <span>{(versionA.fileSize / 1024).toFixed(2)} KB</span>
          </div>

          <div className="compare-row">
            <strong>Uploaded By:</strong>
            <span>{versionA.uploadedBy?.name || 'System'}</span>
          </div>

          <div className="compare-row">
            <strong>Role:</strong>
            <span className={`badge badge-${versionA.uploadedBy?.role?.toLowerCase() || 'viewer'}`} style={{ fontSize: '0.75rem' }}>
              {versionA.uploadedBy?.role}
            </span>
          </div>

          <div className="compare-row">
            <strong>Document Pointer:</strong>
            <code style={{ fontSize: '0.75rem' }}>{versionA._id}</code>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Release Notes / Change Description
            </strong>
            <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
              {versionA.changeDescription || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Version B Card (Newer) */}
        <div className="compare-card active">
          <div className="compare-header" style={{ borderBottomColor: 'rgba(6, 182, 212, 0.2)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Newer Release ({versionB.version})</h3>
            <span className="version-pill">
              Release Date: {new Date(versionB.uploadedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="compare-row">
            <strong>Filename:</strong>
            <span style={{ fontFamily: 'monospace', color: versionA.fileName !== versionB.fileName ? 'var(--warning)' : 'inherit' }}>
              {versionB.fileName}
            </span>
          </div>

          <div className="compare-row">
            <strong>File Size:</strong>
            <span className={sizeDiff > 0 ? 'diff-negative' : sizeDiff < 0 ? 'diff-positive' : ''}>
              {(versionB.fileSize / 1024).toFixed(2)} KB
              {sizeDiff !== 0 && ` (${sizeDiff > 0 ? '+' : ''}${sizeDiffKb} KB)`}
            </span>
          </div>

          <div className="compare-row">
            <strong>Uploaded By:</strong>
            <span style={{ color: versionA.uploadedBy?._id !== versionB.uploadedBy?._id ? 'var(--warning)' : 'inherit' }}>
              {versionB.uploadedBy?.name || 'System'}
            </span>
          </div>

          <div className="compare-row">
            <strong>Role:</strong>
            <span className={`badge badge-${versionB.uploadedBy?.role?.toLowerCase() || 'viewer'}`} style={{ fontSize: '0.75rem' }}>
              {versionB.uploadedBy?.role}
            </span>
          </div>

          <div className="compare-row">
            <strong>Document Pointer:</strong>
            <code style={{ fontSize: '0.75rem' }}>{versionB._id}</code>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Release Notes / Change Description
            </strong>
            <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
              {versionB.changeDescription || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionComparePage;
