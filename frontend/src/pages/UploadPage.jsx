import React, { useEffect, useState } from 'react';
import { getComponents, uploadFile } from '../services/api';

const UploadPage = ({ preSelectedComponentId, onNavigate, currentUser }) => {
  const [components, setComponents] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState(preSelectedComponentId || '');
  const [category, setCategory] = useState('Design Data');
  const [changeDescription, setChangeDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const allowedCategories = ['Design Data', 'Procurement Data', 'Production Data', 'Performance Data'];

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const data = await getComponents();
        setComponents(data);
      } catch (err) {
        setError('Failed to fetch components list.');
      }
    };
    fetchComponents();
  }, []);

  // Set default component to user's assigned component if they are a manufacturer
  useEffect(() => {
    if (currentUser.role === 'Manufacturer' && currentUser.assignedComponent && !preSelectedComponentId) {
      setSelectedCompId(currentUser.assignedComponent._id || currentUser.assignedComponent);
    }
  }, [currentUser, preSelectedComponentId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null); // Clear results
    }
  };

  // Enforce manufacturer authorization locally
  const isAssigned = selectedCompId && 
    currentUser.role === 'Manufacturer' && 
    currentUser.assignedComponent && 
    (currentUser.assignedComponent._id === selectedCompId || currentUser.assignedComponent === selectedCompId);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCompId) {
      setError('Please select a component');
      return;
    }
    if (!category) {
      setError('Please select a standardized data category');
      return;
    }
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }

    if (!isAssigned) {
      setError('Permission Denied: You cannot upload files to other components.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadFile(selectedCompId, file, category, changeDescription);
      setResult(data);
      setFile(null);
      setChangeDescription('');
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedComp = components.find(c => c._id === selectedCompId);
  const selectedCompName = selectedComp?.name || 'Component';

  return (
    <div className="upload-container">
      <div className="page-header">
        <div>
          <h2>Data Upload Center</h2>
          <p className="subtitle">Enforce strictly structured and version-controlled radar system records.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="upload-layout">
        <div className="upload-card">
          <form onSubmit={handleUpload} className="upload-form">
            {error && <div className="alert alert-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="comp-select">Select Hardware Component</label>
              <select
                id="comp-select"
                value={selectedCompId}
                onChange={(e) => {
                  setSelectedCompId(e.target.value);
                  setResult(null);
                }}
                disabled={loading}
                required
              >
                <option value="">-- Choose Component --</option>
                {components.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedCompId && !isAssigned && (
              <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>
                🔒 <strong>Read-Only Warning:</strong> You are not registered as the manufacturer for <em>"{selectedCompName}"</em>. You cannot upload records here.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="cat-select">Standardized Data Category</label>
              <select
                id="cat-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading || !isAssigned}
                required
              >
                {allowedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="change-desc">Change Description / Summary</label>
              <input
                id="change-desc"
                type="text"
                placeholder="e.g. Updated specifications to meet naval temperature tests"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                disabled={loading || !isAssigned}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="file-input">Choose Data File</label>
              <div className="custom-file-upload">
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading || !isAssigned}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading || !isAssigned}
            >
              {loading ? 'Uploading & Traversing Graph...' : 'Upload & Commit Version'}
            </button>
          </form>
        </div>

        {/* Upload and Notification Results */}
        {result && (
          <div className="results-container animate-fade-in">
            <div className="success-banner">
              <h4>✓ Version Committed Successfully</h4>
              <p>Old records preserved. Brand new sequential version saved to the immutable ledger.</p>
            </div>

            <div className="result-details">
              <div className="result-grid">
                <div>
                  <strong>Active Component:</strong>
                  <p>{selectedCompName}</p>
                </div>
                <div>
                  <strong>Category:</strong>
                  <p className="text-highlight">{result.data.category}</p>
                </div>
                <div>
                  <strong>Committed Version:</strong>
                  <p className="version-tag-large">{result.data.version}</p>
                </div>
                <div>
                  <strong>Uploaded By:</strong>
                  <p>{result.data.uploadedBy?.name || 'You'}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Filename:</strong>
                  <p className="file-name-text">{result.data.fileName}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Change Summary:</strong>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{result.data.changeDescription}</p>
                </div>
              </div>
            </div>

            <div className="alerts-card">
              <h4 className="alerts-title">
                ⚠️ Dependency Alert Engine ({result.affectedComponents?.length || 0} Affected Elements)
              </h4>
              <p className="alerts-description">
                The following connected elements are transitively affected by this change and may require recalibration:
              </p>
              {result.affectedComponents && result.affectedComponents.length > 0 ? (
                <div className="alerts-list">
                  {result.affectedComponents.map((ac) => (
                    <div key={ac._id} className="alert-item">
                      <span className="alert-bullet">⚠</span>
                      <div className="alert-info">
                        <span className="alert-name">{ac.name}</span>
                        <span className="alert-type">({ac.type})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-alerts-state">
                  No other components are affected. This is a standalone component configuration.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
