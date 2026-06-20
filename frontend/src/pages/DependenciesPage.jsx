import React, { useEffect, useState } from 'react';
import { getDependencies, createDependency, deleteDependency, getComponents } from '../services/api';

const DependenciesPage = ({ onNavigate, currentUser }) => {
  const [dependencies, setDependencies] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [sourceCompId, setSourceCompId] = useState('');
  const [dependentCompId, setDependentCompId] = useState('');
  const [impactLevel, setImpactLevel] = useState('High');

  const fetchDependenciesAndComponents = async () => {
    setLoading(true);
    setError('');
    try {
      const [depsData, compsData] = await Promise.all([
        getDependencies(),
        getComponents()
      ]);
      setDependencies(depsData);
      setComponents(compsData);
    } catch (err) {
      setError('Failed to fetch dependencies or components.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependenciesAndComponents();
  }, []);

  const handleAddDependency = async (e) => {
    e.preventDefault();
    if (!sourceCompId || !dependentCompId || !impactLevel) {
      setError('Please select both components and the impact level.');
      return;
    }
    if (sourceCompId === dependentCompId) {
      setError('A component cannot depend on itself.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await createDependency(sourceCompId, dependentCompId, impactLevel);
      setSuccess('Dependency relationship defined successfully!');
      setSourceCompId('');
      setDependentCompId('');
      setImpactLevel('High');
      fetchDependenciesAndComponents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create dependency.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this dependency relationship?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await deleteDependency(id);
      setSuccess('Dependency removed.');
      fetchDependenciesAndComponents();
    } catch (err) {
      setError('Failed to delete dependency.');
    }
  };

  // Build breadcrumbs path for components dropdown
  const getCompPath = (comp) => {
    let path = comp.name;
    let current = comp;
    while (current.parent) {
      const parentId = typeof current.parent === 'object' ? current.parent._id : current.parent;
      const parentComp = components.find(c => c._id === parentId);
      if (!parentComp) break;
      path = `${parentComp.name} ➔ ${path}`;
      current = parentComp;
    }
    return `${path} (${comp.type})`;
  };

  // Compute graph levels dynamically for visual rendering
  const computeGraphLevels = () => {
    if (dependencies.length === 0 || components.length === 0) return [];
    
    // Only map components that are in the dependencies to keep graph focused
    const mappedIds = new Set();
    dependencies.forEach(d => {
      if (d.sourceComponent) mappedIds.add(d.sourceComponent._id);
      if (d.dependentComponent) mappedIds.add(d.dependentComponent._id);
    });

    const graphComponents = components.filter(c => mappedIds.has(c._id));
    
    // Assign levels using a topological BFS approach
    const levels = {};
    graphComponents.forEach(c => { levels[c._id] = 0; });

    let updated = true;
    let iteration = 0;
    while (updated && iteration < 10) { // Limit iterations to avoid cycles
      updated = false;
      dependencies.forEach(d => {
        if (!d.sourceComponent || !d.dependentComponent) return;
        const srcId = d.sourceComponent._id;
        const depId = d.dependentComponent._id;
        if (levels[depId] <= levels[srcId]) {
          levels[depId] = levels[srcId] + 1;
          updated = true;
        }
      });
      iteration++;
    }

    // Group components by level
    const levelsGroup = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!levelsGroup[lvl]) levelsGroup[lvl] = [];
      const comp = components.find(c => c._id === id);
      if (comp) levelsGroup[lvl].push(comp);
    });

    return Object.entries(levelsGroup)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([lvl, comps]) => ({ level: lvl, components: comps }));
  };

  const graphLevels = computeGraphLevels();

  return (
    <div className="dependencies-container">
      <div className="page-header">
        <div>
          <h2>Dependency Management System</h2>
          <p className="subtitle">Trace and configure critical engineering links across components</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="dependencies-layout">
        {/* Left Column: Management List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {currentUser.role === 'Admin' && (
            <div className="upload-card">
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Define Dependency Link</h3>
              <form onSubmit={handleAddDependency} className="upload-form">
                <div className="form-group">
                  <label htmlFor="source-comp">Source Component (Changes trigger alert)</label>
                  <select
                    id="source-comp"
                    value={sourceCompId}
                    onChange={(e) => setSourceCompId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Source --</option>
                    {components.map(c => (
                      <option key={c._id} value={c._id}>
                        {getCompPath(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dependent-comp">Dependent Component (Receives alert)</label>
                  <select
                    id="dependent-comp"
                    value={dependentCompId}
                    onChange={(e) => setDependentCompId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Dependent --</option>
                    {components.map(c => (
                      <option key={c._id} value={c._id}>
                        {getCompPath(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="impact-level">Impact Level</label>
                  <select
                    id="impact-level"
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value)}
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Add Dependency relationship
                </button>
              </form>
            </div>
          )}

          {/* Active Links Table */}
          <div className="upload-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Active Dependency Registry</h3>
            {dependencies.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>No dependencies defined.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem' }}>Source</th>
                      <th style={{ padding: '0.5rem' }}>➔ Dependent</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Impact</th>
                      {currentUser.role === 'Admin' && <th style={{ padding: '0.5rem', textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dependencies.map(d => (
                      <tr key={d._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.5rem 0.25rem', fontWeight: '500' }}>
                          {d.sourceComponent?.name || 'Deleted Component'}
                        </td>
                        <td style={{ padding: '0.5rem 0.25rem' }}>
                          {d.dependentComponent?.name || 'Deleted Component'}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span className={`badge ${
                            d.impactLevel === 'High' ? 'badge-danger' : d.impactLevel === 'Medium' ? 'badge-warning' : 'badge-info'
                          }`} style={{ fontSize: '0.7rem' }}>
                            {d.impactLevel}
                          </span>
                        </td>
                        {currentUser.role === 'Admin' && (
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDelete(d._id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                              🗑 Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Graph */}
        <div className="dependency-graph-card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>System Dependency Flow Graph</h3>
            <p className="subtitle" style={{ fontSize: '0.8rem' }}>Chronological flow showing how changes propagate from bottom levels upward</p>
          </div>
          
          <div className="graph-canvas">
            {graphLevels.length === 0 ? (
              <div className="empty-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p className="text-muted">No dependency graph available. Define relationships to build graph hierarchy.</p>
              </div>
            ) : (
              graphLevels.map(lvl => (
                <div key={lvl.level} className="graph-level">
                  {lvl.components.map(comp => (
                    <div
                      key={comp._id}
                      className="graph-node"
                      onClick={() => onNavigate('impact-analysis', comp._id)}
                      title="Click to run Impact Analysis"
                    >
                      <div className="graph-node-title">{comp.name}</div>
                      <div className="graph-node-sub">{comp.type} | {comp.category}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependenciesPage;
