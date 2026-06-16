import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import VersionHistoryPage from './pages/VersionHistoryPage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCompId, setSelectedCompId] = useState(null);

  const handleNavigate = (page, componentId = null) => {
    setSelectedCompId(componentId);
    setCurrentPage(page);
  };

  return (
    <div className="app-container">
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
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}
        {currentPage === 'upload' && (
          <UploadPage 
            preSelectedComponentId={selectedCompId} 
            onNavigate={handleNavigate} 
          />
        )}
        {currentPage === 'history' && (
          <VersionHistoryPage 
            componentId={selectedCompId} 
            onNavigate={handleNavigate} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 IPDE - B.Tech Final Year Capstone Project. Structured MERN Architecture.</p>
      </footer>
    </div>
  );
}

export default App;
