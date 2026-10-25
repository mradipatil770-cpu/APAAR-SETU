import React from 'react';

export default function Navbar({ activeTab, setActiveTab, healthStatus, readyStatus }) {
  return (
    <nav className="gov-navbar">
      <div className="gov-navbar-inner">
        <div className="gov-nav-links">
          <button
            className={`gov-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>🏛️</span>
            <span>Dashboard / मुख्य पृष्ठ</span>
          </button>

          <button
            className={`gov-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span>📤</span>
            <span>CSV Upload / डेटा अपलोड</span>
          </button>

          <button
            className={`gov-nav-item ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            <span>⚠️</span>
            <span>Anomaly Review / विसंगति समीक्षा</span>
          </button>

          <button
            className={`gov-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span>📑</span>
            <span>Compliance Reports / रिपोर्ट</span>
          </button>
        </div>

        <div className="gov-user-context">
          <span className="gov-inst-tag">AICTE-ENG-001</span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Role: INSTITUTE_ADMIN</span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className={`gov-status-dot ${healthStatus === 'ok' ? 'online' : 'offline'}`}
              title={`API Health: ${healthStatus}`}
            />
            <span style={{ fontSize: '0.75rem' }}>API</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className={`gov-status-dot ${readyStatus === 'ready' ? 'online' : 'offline'}`}
              title={`Database Status: ${readyStatus}`}
            />
            <span style={{ fontSize: '0.75rem' }}>DB</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
