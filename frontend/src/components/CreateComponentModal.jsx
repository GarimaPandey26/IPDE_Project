import React, { useState, useEffect } from 'react';
import { createComponent } from '../services/api';

const CreateComponentModal = ({ isOpen, onClose, onComponentCreated, defaultParentId, currentUser, allComponents = [] }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Sub-module');
  const [category, setCategory] = useState('Signal Processing Components');
  const [parentId, setParentId] = useState('');
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

  // Filter components that a manufacturer is allowed to create subcomponents under
  const getAllowedParents = () => {
    if (currentUser?.role === 'Admin') {
      return allComponents;
    }
    if (currentUser?.role === 'Manufacturer') {
      const assignedId = currentUser.assignedComponent?._id || currentUser.assignedComponent;
      if (!assignedId) return [];

      return allComponents.filter(c => {
        let currentId = c._id;
        while (currentId) {
          if (currentId === assignedId) return true;
          const parentComp = allComponents.find(item => item._id === currentId);
          currentId = parentComp && parentComp.parent ? (parentComp.parent._id || parentComp.parent) : null;
        }
        return false;
      });
    }
    return [];
  };

  const allowedParents = getAllowedParents();

  useEffect(() => {
    if (isOpen) {
      setError('');
      setName('');
      
      const assignedId = currentUser?.assignedComponent?._id || currentUser?.assignedComponent;
      
      // Determine default parent ID
      let finalParentId = '';
      if (defaultParentId) {
        // If defaultParentId is in the manufacturer's branch
        const isAllowed = allowedParents.some(p => p._id === defaultParentId);
        if (isAllowed || currentUser?.role === 'Admin') {
          finalParentId = defaultParentId;
        } else if (currentUser?.role === 'Manufacturer' && assignedId) {
          finalParentId = assignedId;
        }
      } else if (currentUser?.role === 'Manufacturer' && assignedId) {
        finalParentId = assignedId;
      }

      setParentId(finalParentId);

      // Default type and category based on parent selection
      if (finalParentId) {
        const parentComp = allComponents.find(c => c._id === finalParentId);
        if (parentComp) {
          setType(parentComp.type === 'Module' ? 'Sub-module' : 'Component');
          setCategory(parentComp.category);
        }
      } else {
        setType(currentUser?.role === 'Admin' ? 'Module' : 'Sub-module');
        setCategory(categories[0]);
      }
    }
  }, [isOpen, defaultParentId, allComponents, currentUser]);

  if (!isOpen) return null;

  // Handle parent changes to auto-update type and category defaults
  const handleParentChange = (newParentId) => {
    setParentId(newParentId);
    if (newParentId) {
      const parentComp = allComponents.find(c => c._id === newParentId);
      if (parentComp) {
        setType(parentComp.type === 'Module' ? 'Sub-module' : 'Component');
        setCategory(parentComp.category);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }

    if (currentUser?.role === 'Manufacturer' && !parentId) {
      setError('Manufacturers must select a parent component under their assigned main module.');
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
              {currentUser?.role === 'Admin' && <option value="Module">Module (Root level)</option>}
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
              onChange={(e) => handleParentChange(e.target.value)}
              disabled={loading}
              required={currentUser?.role === 'Manufacturer'}
            >
              {currentUser?.role === 'Admin' && <option value="">-- No Parent (Root Module) --</option>}
              {allowedParents.map((c) => (
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
