import React, { useEffect, useState } from 'react';
import { getComponents, uploadFile } from '../services/api';

const UploadPage = ({ preSelectedComponentId, onNavigate }) => {
  const [components, setComponents] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState(preSelectedComponentId || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null); // Clear previous results on new file selection
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCompId) {
      setError('Please select a component');
      return;
    }
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await uploadFile(selectedCompId, file);
      setResult(data);
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedCompName = components.find(c => c._id === selectedCompId)?.name || 'Component';

  return (
    <div className="upload-container">
      <div className="page-header">
        <div>
          <h2>Data Upload Center</h2>
          <p className="subtitle">Upload design schematics, manuals, or configurations with full version control.</p>
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

            <div className="form-group">
              <label htmlFor="file-input">Choose Data File</label>
              <div className="custom-file-upload">
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Uploading & Traversing Graph...' : 'Upload & Notify System'}
            </button>
          </form>
        </div>

        {/* Upload and Notification Results */}
        {result && (
          <div className="results-container animate-fade-in">
            <div className="success-banner">
              <h4>✓ Upload Completed Successfully</h4>
              <p>New version committed to database records.</p>
            </div>

            <div className="result-details">
              <div className="result-grid">
                <div>
                  <strong>Active Component:</strong>
                  <p>{selectedCompName}</p>
                </div>
                <div>
                  <strong>Committed Version:</strong>
                  <p className="version-tag-large">{result.data.version}</p>
                </div>
                <div>
                  <strong>Filename:</strong>
                  <p className="file-name-text">{result.data.fileName}</p>
                </div>
                <div>
                  <strong>Size:</strong>
                  <p>{(result.data.fileSize / 1024).toFixed(2)} KB</p>
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
