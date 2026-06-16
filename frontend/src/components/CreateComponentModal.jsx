import React, { useState, useEffect } from 'react';
import { createComponent, getComponents } from '../services/api';

const CreateComponentModal = ({ isOpen, onClose, onComponentCreated, defaultParentId }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Component');
  const [category, setCategory] = useState('Signal Processing Components');
  const [parentId, setParentId] = useState('');
  const [components, setComponents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'RF & Microwave Components',
    'Signal Processing Components',
    'Communication Components',
    'Power Components',
    'Mechanical Components',
    'Environmental Components',
    'Cooling Components',
    'Storage Components',
    'Software Components',
    'Control Components',
    'Security Components',
    'Maintenance Components'
  ];

  useEffect(() => {
    if (isOpen) {
      const fetchComponents = async () => {
        try {
          const data = await getComponents();
          setComponents(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchComponents();
      
      // Set default parent if provided
      if (defaultParentId) {
        setParentId(defaultParentId);
        // Automatically default type to child level
        const parentComp = components.find(c => c._id === defaultParentId);
        if (parentComp) {
          setType(parentComp.type === 'Module' ? 'Sub-module' : 'Component');
          setCategory(parentComp.category);
        }
      } else {
        setParentId('');
      }
    }
  }, [isOpen, defaultParentId]);

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
      await createComponent({
        name: name.trim(),
        type,
        category,
        parentId: parentId || null
      });
      setName('');
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
          <h3>Add System Node</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="comp-name">Node Name</label>
            <input
              id="comp-name"
              type="text"
              placeholder="e.g. FFT Modules, Clutter Filter..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="comp-type">Node Type</label>
            <select
              id="comp-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              <option value="Module">Module (Root level)</option>
              <option value="Sub-module">Sub-module (Mid level)</option>
              <option value="Component">Component (Leaf level)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comp-category">Engineering Category</label>
            <select
              id="comp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parent-select">Parent Node</label>
            <select
              id="parent-select"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- No Parent (Root Module) --</option>
              {components.map((c) => (
                <option key={c._id} value={c._id}>
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
              {loading ? 'Creating...' : 'Create Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateComponentModal;
