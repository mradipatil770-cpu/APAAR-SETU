import React, { useState, useEffect } from 'react';

export default function GovernmentHeader({
  currentUser,
  onSignIn,
  onSignOut,
  onGoHome,
  onFontSizeChange,
}) {
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1, 0, 1
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ' | ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFontChange = (level) => {
    setFontSizeLevel(level);
    if (onFontSizeChange) onFontSizeChange(level);
    const root = document.documentElement;
    if (level === -1) root.style.fontSize = '14px';
    else if (level === 1) root.style.fontSize = '17px';
    else root.style.fontSize = '15px';
  };

  return (
    <header className="gov-portal-header">
      {/* 1. Indian Tricolor Accent Strip */}
      <div className="gov-tricolor-strip" />

      {/* 2. Top Utility & Accessibility Bar */}
      <div className="gov-top-utility">
        <div className="gov-top-utility-left">
          <span className="gov-portal-meta-tag">AICTE-Approved Technical Institutions Portal</span>
          <span className="gov-utility-separator">•</span>
          <span>Academic Session 2026–27</span>
          <span className="gov-utility-separator">•</span>
          <span className="gov-tag-ps">AICTE PS 26263</span>
        </div>
        <div className="gov-top-utility-right">
          <span className="gov-clock-text">{currentTime}</span>
          <span className="gov-utility-separator">•</span>
          <div className="gov-accessibility-controls" aria-label="Font size controls">
            <button
              className={`gov-access-btn ${fontSizeLevel === -1 ? 'active' : ''}`}
              title="Decrease Font Size"
              onClick={() => handleFontChange(-1)}
            >
              A-
            </button>
            <button
              className={`gov-access-btn ${fontSizeLevel === 0 ? 'active' : ''}`}
              title="Default Font Size"
              onClick={() => handleFontChange(0)}
            >
              A
            </button>
            <button
              className={`gov-access-btn ${fontSizeLevel === 1 ? 'active' : ''}`}
              title="Increase Font Size"
              onClick={() => handleFontChange(1)}
            >
              A+
            </button>
          </div>
          <span className="gov-utility-separator">•</span>
          <span className="gov-lang-tag">English / हिन्दी</span>
        </div>
      </div>

      {/* 3. Main Government Brand Masthead */}
      <div className="gov-masthead">
        <div className="gov-masthead-inner">
          <div className="gov-brand-group" onClick={onGoHome} style={{ cursor: 'pointer' }}>
            {/* Dignified Geometric Bridge/Gateway Icon */}
            <div className="gov-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="38" width="40" height="4" rx="2" fill="#0b2545" />
                <path d="M10 38V18C10 14 14 10 24 10C34 10 38 14 38 18V38" stroke="#0b2545" strokeWidth="3" />
                <path d="M18 38V24C18 21 20 19 24 19C28 19 30 21 30 24V38" stroke="#1351b4" strokeWidth="2.5" />
                <circle cx="24" cy="8" r="3" fill="#f26a1b" />
                <line x1="24" y1="19" x2="24" y2="38" stroke="#138808" strokeWidth="2" strokeDasharray="2 2" />
              </svg>
            </div>

            <div className="gov-title-group">
              <div className="gov-title-hindi">अपर सेतु</div>
              <h1 className="gov-title-en">APAARSetu</h1>
              <div className="gov-subtitle">
                Institutional Student Enrolment & Intake Compliance Portal
              </div>
            </div>
          </div>

          <div className="gov-masthead-right">
            <div className="gov-compliance-badge">
              <div className="gov-compliance-badge-title">AICTE Intake Monitor</div>
              <div className="gov-compliance-badge-sub">Section 10(1)(b) Framework</div>
            </div>

            {!currentUser ? (
              <button
                className="gov-btn-primary gov-btn-header-login"
                onClick={onSignIn}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-icon">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Portal Sign In</span>
              </button>
            ) : (
              <div className="gov-header-user-badge">
                <span className="gov-user-role-pill">{currentUser.role}</span>
                <span className="gov-user-email-text">{currentUser.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
