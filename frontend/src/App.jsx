import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import VersionHistoryPage from './pages/VersionHistoryPage';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCompId, setSelectedCompId] = useState(null);

  // Parse user object from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [token]);

  const handleAuthSuccess = (user) => {
    setToken(localStorage.getItem('token') || '');
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setCurrentUser(null);
    setAuthMode('login');
    setCurrentPage('dashboard');
    setSelectedCompId(null);
  };

  const handleNavigate = (page, componentId = null) => {
    setSelectedCompId(componentId);
    setCurrentPage(page);
  };

  // If not authenticated, render Login/Register
  if (!token || !currentUser) {
    return (
      <div className="auth-container-fullscreen">
        {authMode === 'login' ? (
          <Login 
            onAuthSuccess={handleAuthSuccess} 
            onNavigateToRegister={() => setAuthMode('register')} 
          />
        ) : (
          <Register 
            onAuthSuccess={handleAuthSuccess} 
            onNavigateToLogin={() => setAuthMode('login')} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => handleNavigate('dashboard')}>
          <span className="logo-icon">📡</span>
          <div className="logo-text">
            <h1>IPDE Portal</h1>
            <span className="logo-sub">Integrated Platform Data Environment</span>
          </div>
        </div>

        <ul className="navbar-links">
          <li className={currentPage === 'dashboard' ? 'active' : ''}>
            <button onClick={() => handleNavigate('dashboard')}>Dashboard</button>
          </li>
          <li className={currentPage === 'upload' ? 'active' : ''}>
            <button onClick={() => handleNavigate('upload')}>Upload Center</button>
          </li>
        </ul>

        {/* User Profile Info & Logout */}
        <div className="navbar-profile">
          <div className="profile-details">
            <span className="profile-name">{currentUser.name}</span>
            <div className="profile-role-badge">
              <span className={`badge badge-${currentUser.role.toLowerCase()}`}>
                {currentUser.role === 'Admin'
                  ? 'Admin'
                  : currentUser.role === 'Manufacturer' 
                  ? `Mfg: ${currentUser.assignedComponent?.name || 'Unassigned'}` 
                  : 'Viewer'}
              </span>
            </div>
          </div>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} currentUser={currentUser} />
        )}
        {currentPage === 'upload' && (
          <UploadPage 
            preSelectedComponentId={selectedCompId} 
            onNavigate={handleNavigate} 
            currentUser={currentUser}
          />
        )}
        {currentPage === 'history' && (
          <VersionHistoryPage 
            componentId={selectedCompId} 
            onNavigate={handleNavigate} 
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 IPDE - Radar System Data Management Portal. Modularized Platform Breakdown Structure (MBPS).</p>
      </footer>
    </div>
  );
}

export default App;
