import React, { useEffect, useState } from 'react';
import { getComponents, register } from '../services/api';

const Register = ({ onAuthSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer'); // Default Viewer
  const [assignedComponentId, setAssignedComponentId] = useState('');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all components to display in the hierarchy selector
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const data = await getComponents();
        setComponents(data);
      } catch (err) {
        setError('Failed to fetch radar components list.');
      }
    };
    fetchComponents();
  }, []);

  // Build breadcrumb paths for components (e.g. Signal Processing > DSP > FFT Modules)
  const getComponentPath = (comp) => {
    let path = comp.name;
    let current = comp;
    while (current.parent) {
      const parentId = typeof current.parent === 'object' ? current.parent._id : current.parent;
      const parentComp = components.find(c => c._id === parentId);
      if (!parentComp) break;
      path = `${parentComp.name} ➔ ${path}`;
      current = parentComp;
    }
    return `${path} (${comp.category})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Please fill in all required fields');
      return;
    }

    if (role === 'Manufacturer' && !assignedComponentId) {
      setError('Manufacturers must select their assigned module/component');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await register(
        name,
        email,
        password,
        role,
        role === 'Manufacturer' ? assignedComponentId : null
      );
      setSuccess('Registration successful! Logging in...');
      setTimeout(() => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">📡</span>
          <h2>Register Account</h2>
          <p>Integrated Platform Data Environment (IPDE)</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Dr. Rajesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              placeholder="rajesh.kumar@drdo.res.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role-select">What is your role?</label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setAssignedComponentId('');
              }}
              disabled={loading}
              required
            >
              <option value="Viewer">Viewer / Observer (Read-Only Access)</option>
              <option value="Manufacturer">Manufacturer (Write Access for Assigned Component)</option>
            </select>
          </div>

          {role === 'Manufacturer' && (
            <div className="form-group animate-fade-in">
              <label htmlFor="component-select">Which component/module/sub-module do you manufacture?</label>
              <select
                id="component-select"
                value={assignedComponentId}
                onChange={(e) => setAssignedComponentId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">-- Select Component from Radar MBPS Hierarchy --</option>
                {components.map((c) => (
                  <option key={c._id} value={c._id}>
                    {getComponentPath(c)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Profile'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <button className="btn-link" onClick={onNavigateToLogin}>
            Sign in to your profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
