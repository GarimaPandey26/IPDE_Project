import React, { useState } from 'react';
import { createComponent } from '../services/api';

const CreateComponentModal = ({ isOpen, onClose, onComponentCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Radar');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const componentTypes = [
    'Radar',
    'Antenna',
    'Transmitter',
    'Receiver',
    'Processor',
    'Display Unit',
    'Controller',
    'Sensor'
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createComponent({ name: name.trim(), type });
      setName('');
      setType('Radar');
      onComponentCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create component');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Create New Component</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="comp-name">Component Name</label>
            <input
              id="comp-name"
              type="text"
              placeholder="e.g. Primary Radar Antenna"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="comp-type">Component Type</label>
            <select
              id="comp-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              {componentTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateComponentModal;
