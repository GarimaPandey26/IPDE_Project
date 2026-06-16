import React, { useState } from 'react';
import { connectComponents } from '../services/api';

const ConnectComponentModal = ({ isOpen, onClose, components, onComponentsConnected }) => {
  const [componentIdA, setComponentIdA] = useState('');
  const [componentIdB, setComponentIdB] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!componentIdA || !componentIdB) {
      setError('Please select both components');
      return;
    }
    if (componentIdA === componentIdB) {
      setError('Cannot connect a component to itself');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await connectComponents({ componentIdA, componentIdB });
      setSuccess('Components linked successfully!');
      setTimeout(() => {
        onComponentsConnected();
        onClose();
        setComponentIdA('');
        setComponentIdB('');
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to establish connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Link Components (Interconnectivity)</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="comp-a">Source Component (A)</label>
            <select
              id="comp-a"
              value={componentIdA}
              onChange={(e) => setComponentIdA(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Select Component --</option>
              {components.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="connection-divider">
            <span className="icon-link">⇄</span>
          </div>

          <div className="form-group">
            <label htmlFor="comp-b">Target Component (B)</label>
            <select
              id="comp-b"
              value={componentIdB}
              onChange={(e) => setComponentIdB(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Select Component --</option>
              {components.map((c) => (
                <option key={c._id} value={c._id} disabled={c._id === componentIdA}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Linking...' : 'Establish Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectComponentModal;
