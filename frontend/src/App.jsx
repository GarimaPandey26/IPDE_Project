import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import VersionHistoryPage from './pages/VersionHistoryPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DependenciesPage from './pages/DependenciesPage';
import NotificationsPage from './pages/NotificationsPage';
import ImpactAnalysisPage from './pages/ImpactAnalysisPage';
import VersionComparePage from './pages/VersionComparePage';
import { getUnreadNotificationsCount } from './services/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [compareVersions, setCompareVersions] = useState({ versionAId: '', versionBId: '' });

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

  const fetchUnreadCount = async () => {
    if (token) {
      try {
        const data = await getUnreadNotificationsCount();
        setUnreadCount(data.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    }
  };

  // Poll for unread notification count
  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [token, currentUser]);

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
    setUnreadCount(0);
  };

  const handleNavigate = (page, componentId = null, extraParams = null) => {
    setSelectedCompId(componentId);
    if (page === 'compare' && extraParams) {
      setCompareVersions({
        versionAId: extraParams.versionAId,
        versionBId: extraParams.versionBId
      });
    }
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
          <li className={currentPage === 'dependencies' ? 'active' : ''}>
            <button onClick={() => handleNavigate('dependencies')}>Dependencies & Graph</button>
          </li>
          <li className={currentPage === 'impact-analysis' ? 'active' : ''}>
            <button onClick={() => handleNavigate('impact-analysis')}>Impact Analysis</button>
          </li>
          <li className={currentPage === 'notifications' ? 'active' : ''}>
            <button onClick={() => handleNavigate('notifications')} className="nav-notif-btn">
              Notifications
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </button>
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
        {currentPage === 'dependencies' && (
          <DependenciesPage 
            onNavigate={handleNavigate} 
            currentUser={currentUser}
          />
        )}
        {currentPage === 'impact-analysis' && (
          <ImpactAnalysisPage 
            preSelectedComponentId={selectedCompId}
            onNavigate={handleNavigate} 
            currentUser={currentUser}
          />
        )}
        {currentPage === 'notifications' && (
          <NotificationsPage 
            onNavigate={handleNavigate} 
            currentUser={currentUser}
            onNotificationRead={fetchUnreadCount}
          />
        )}
        {currentPage === 'compare' && (
          <VersionComparePage 
            componentId={selectedCompId}
            versionAId={compareVersions.versionAId}
            versionBId={compareVersions.versionBId}
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

