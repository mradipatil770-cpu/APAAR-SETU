import React from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  healthStatus,
  readyStatus,
  currentUser,
  onSignOut,
  onViewLanding,
}) {
  const isCentral =
    currentUser?.role === 'AICTE_ADMIN' ||
    currentUser?.role === 'AICTE_ANALYST' ||
    currentUser?.role === 'AUDITOR';

  const institutionalNavItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="gov-nav-icon">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      id: 'upload',
      label: 'Upload Student Data',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="gov-nav-icon">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'anomalies',
      label: 'Review Exceptions',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="gov-nav-icon">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'verifications',
      label: 'Academic Verifications',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="gov-nav-icon">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'reports',
      label: 'Compliance Reports',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="gov-nav-icon">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="gov-navbar" aria-label="Portal Navigation">
      <div className="gov-navbar-inner">
        <div className="gov-nav-links">
          {/* Public Home link */}
          <button
            className="gov-nav-item home-link"
            onClick={onViewLanding}
            title="Return to Public Portal Overview"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="gov-nav-icon">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Public Home</span>
          </button>

          {!isCentral &&
            institutionalNavItems.map((item) => (
              <button
                key={item.id}
                className={`gov-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

          {isCentral && (
            <span className="gov-nav-central-label">
              Central Regulatory Oversight Active
            </span>
          )}
        </div>

        <div className="gov-user-context">
          {currentUser && (
            <>
              <span className="gov-inst-tag" title="Authenticated Institution / Role">
                {currentUser.institution_name
                  ? currentUser.institution_name.slice(0, 24) + '...'
                  : currentUser.institution_id
                  ? 'AICTE-ENG-001'
                  : 'AICTE HQ'}
              </span>
              <span className="gov-role-badge">
                {currentUser.role || 'GUEST'}
              </span>
              <button
                className="gov-btn-signout-subtle"
                onClick={onSignOut}
                title="Sign out of active session"
              >
                Sign Out
              </button>
            </>
          )}

          <div className="gov-service-status" title={`API Server Status: ${healthStatus}`}>
            <span
              className={`gov-status-dot ${healthStatus === 'ok' ? 'online' : 'offline'}`}
            />
            <span className="gov-status-label">API</span>
          </div>

          <div className="gov-service-status" title={`Supabase Database Status: ${readyStatus}`}>
            <span
              className={`gov-status-dot ${readyStatus === 'ready' ? 'online' : 'offline'}`}
            />
            <span className="gov-status-label">DB</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
