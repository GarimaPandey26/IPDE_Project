import React, { useEffect, useState } from 'react';
import { getComponents, getImpactAnalysis } from '../services/api';

const ImpactAnalysisPage = ({ preSelectedComponentId, onNavigate, currentUser }) => {
  const [components, setComponents] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState(preSelectedComponentId || '');
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compsLoading, setCompsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const data = await getComponents();
        setComponents(data);
      } catch (err) {
        setError('Failed to fetch components list.');
      } finally {
        setCompsLoading(false);
      }
    };
    fetchComponents();
  }, []);

  // Run impact analysis when selected component changes
  useEffect(() => {
    if (!selectedCompId) {
      setImpactData(null);
      return;
    }
    
    const runAnalysis = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getImpactAnalysis(selectedCompId);
        setImpactData(data);
      } catch (err) {
        setError('Failed to run change impact analysis.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [selectedCompId]);

  // Set default component to user's assigned component if manufacturer
  useEffect(() => {
    if (currentUser.role === 'Manufacturer' && currentUser.assignedComponent && !preSelectedComponentId) {
      setSelectedCompId(currentUser.assignedComponent._id || currentUser.assignedComponent);
    }
  }, [currentUser, preSelectedComponentId]);

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

  return (
    <div className="impact-analysis-container">
      <div className="page-header">
        <div>
          <h2>Design Change Impact Analyzer</h2>
          <p className="subtitle">Trace propagation waves and identify impacted hardware modules before committing design files</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="upload-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="upload-card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div className="form-group">
            <label htmlFor="impact-comp-select">Simulate Change Origin Component</label>
            {compsLoading ? (
              <p>Loading systems list...</p>
            ) : (
              <select
                id="impact-comp-select"
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Origin Module / Component --</option>
                {components.map(c => (
                  <option key={c._id} value={c._id}>
                    {getCompPath(c)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', margin: '2rem' }} className="text-muted">Calculating dependency propagation paths...</p>}

        {impactData && !loading && (
          <div className="results-container animate-fade-in" style={{ marginTop: '1.5rem' }}>
            <div className="success-banner" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.05))', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <h4 style={{ color: 'var(--primary)' }}>Change Impact Report for: {impactData.origin?.name}</h4>
              <p>Type: {impactData.origin?.type} | Impacted modules: {impactData.affected?.length || 0}</p>
            </div>

            <div className="upload-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Impact Analysis Log</h3>
              
              {impactData.affected.length === 0 ? (
                <div className="no-alerts-state" style={{ padding: '2rem' }}>
                  No dependent modules are affected by updating this component's design. This is a leaf component in the dependency chain.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Dependent Component</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Impact Level</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Propagation Path</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Responsible Manufacturer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactData.affected.map(a => (
                        <tr key={a._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: '600', color: '#fff' }}>{a.name}</td>
                          <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{a.type}</td>
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            <span className={`badge ${
                              a.impactLevel === 'High' ? 'badge-danger' : a.impactLevel === 'Medium' ? 'badge-warning' : 'badge-info'
                            }`} style={{ fontSize: '0.75rem' }}>
                              {a.impactLevel}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {a.path}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            {a.manufacturers && a.manufacturers.length > 0 ? (
                              a.manufacturers.map(m => (
                                <div key={m.email} style={{ fontSize: '0.85rem' }}>
                                  <strong>{m.name}</strong> <span className="text-muted">({m.email})</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>None Assigned</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactAnalysisPage;
