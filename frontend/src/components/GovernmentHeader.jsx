import React, { useState, useEffect } from 'react';
import { getTranslation } from '../i18n/translations';

export default function GovernmentHeader({
  currentUser,
  onSignIn,
  onSignOut,
  onGoHome,
  lang = 'en',
  onToggleLang,
}) {
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1: small, 0: default, 1: large
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
          ' | ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const handleFontChange = (level) => {
    setFontSizeLevel(level);
    const root = document.documentElement;
    if (level === -1) {
      root.style.fontSize = '14px';
    } else if (level === 1) {
      root.style.fontSize = '17px';
    } else {
      root.style.fontSize = '15px';
    }
  };

  return (
    <header className="gov-portal-header" role="banner">
      {/* 1. Restrained Indian Tricolor Accent Strip */}
      <div className="gov-tricolor-strip" aria-hidden="true" />

      {/* 2. Top Utility & Accessibility Bar */}
      <div className="gov-top-utility">
        <div className="gov-top-utility-inner">
          <div className="gov-top-utility-left">
            <span className="gov-utility-portal-title">{getTranslation('govIndia', lang)}</span>
            <span className="gov-utility-separator" aria-hidden="true">•</span>
            <span>{getTranslation('ministryEdu', lang)}</span>
            <span className="gov-utility-separator" aria-hidden="true">•</span>
            <span>Academic Session 2026–27</span>
          </div>

          <div className="gov-top-utility-right">
            <time className="gov-utility-clock" aria-label="Current portal time">{currentTime}</time>
            <span className="gov-utility-separator" aria-hidden="true">•</span>
            
            {/* Accessibility Controls: Font Resizing */}
            <div className="gov-accessibility-controls" aria-label="Text size adjustment">
              <span className="gov-access-label" id="text-size-label">{getTranslation('textSize', lang)}:</span>
              <button
                type="button"
                className={`gov-access-btn ${fontSizeLevel === -1 ? 'active' : ''}`}
                aria-labelledby="text-size-label"
                aria-pressed={fontSizeLevel === -1}
                title="Decrease font size"
                onClick={() => handleFontChange(-1)}
              >
                A-
              </button>
              <button
                type="button"
                className={`gov-access-btn ${fontSizeLevel === 0 ? 'active' : ''}`}
                aria-labelledby="text-size-label"
                aria-pressed={fontSizeLevel === 0}
                title="Default font size"
                onClick={() => handleFontChange(0)}
              >
                A
              </button>
              <button
                type="button"
                className={`gov-access-btn ${fontSizeLevel === 1 ? 'active' : ''}`}
                aria-labelledby="text-size-label"
                aria-pressed={fontSizeLevel === 1}
                title="Increase font size"
                onClick={() => handleFontChange(1)}
              >
                A+
              </button>
            </div>

            <span className="gov-utility-separator" aria-hidden="true">•</span>

            {/* Bilingual Language Switcher Toggle */}
            <button
              type="button"
              className="gov-lang-indicator-btn"
              onClick={onToggleLang}
              title={lang === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
              aria-label="Toggle language between English and Hindi"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px', marginRight: '4px' }}>
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.25a12.87 12.87 0 01-1.39 3.125 12.92 12.92 0 003.58 2.085 1 1 0 11-.74 1.856 14.93 14.93 0 01-4.14-2.484 14.93 14.93 0 01-4.14 2.484 1 1 0 11-.74-1.856 12.92 12.92 0 003.58-2.085A12.87 12.87 0 013.9 6H2a1 1 0 010-2h3V3a1 1 0 011-1zm6 6a1 1 0 011 1v7a1 1 0 11-2 0v-7a1 1 0 011-1zm3 0a1 1 0 011 1v7a1 1 0 11-2 0v-7a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>{lang === 'en' ? 'हिन्दी (Hindi)' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Institutional Brand Masthead */}
      <div className="gov-masthead">
        <div className="gov-masthead-inner">
          <div
            className="gov-brand-group"
            onClick={onGoHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onGoHome()}
            title="Go to APAARSetu Portal Home"
          >
            {/* National Emblem & AICTE Symbol */}
            <div className="gov-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="gov-symbol-svg">
                <rect x="2" y="32" width="36" height="4" rx="1.5" fill="#0b2545" />
                <path d="M8 32V16C8 12.6863 10.6863 10 14 10H26C29.3137 10 32 12.6863 32 16V32" stroke="#0b2545" strokeWidth="2.5" />
                <path d="M14 32V20C14 17.7909 15.7909 16 18 16H22C24.2091 16 26 17.7909 26 20V32" stroke="#133b68" strokeWidth="2" />
                <circle cx="20" cy="6" r="2.5" fill="#d97706" />
                <line x1="20" y1="16" x2="20" y2="32" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="2 2" />
              </svg>
            </div>

            <div className="gov-title-group">
              <div className="gov-title-hindi" lang="hi">अखिल भारतीय तकनीकी शिक्षा परिषद • विनियमन ब्यूरो</div>
              <h1 className="gov-title-en">
                {lang === 'hi' ? 'अपार सेतु (APAARSetu)' : 'APAARSetu'}
              </h1>
              <div className="gov-subtitle">
                {getTranslation('platformSubtitle', lang)}
              </div>
            </div>
          </div>

          {/* Right Action / Context */}
          <div className="gov-masthead-right">
            {!currentUser ? (
              <div className="gov-header-cta-group">
                <button
                  type="button"
                  className="gov-btn-header-signin"
                  onClick={onSignIn}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-icon" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>{getTranslation('navLogin', lang)}</span>
                </button>
              </div>
            ) : (
              <div className="gov-header-auth-badge">
                <div className="gov-auth-meta">
                  <span className="gov-user-role-tag">
                    {getTranslation(`role_${currentUser.role}`, lang) || currentUser.role}
                  </span>
                  <span className="gov-user-email-tag" title={currentUser.email}>
                    {currentUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  className="gov-btn-header-signout"
                  onClick={onSignOut}
                  title="Sign out of active session"
                >
                  {getTranslation('navLogout', lang)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
