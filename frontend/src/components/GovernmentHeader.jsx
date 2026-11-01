import React, { useState } from 'react';
import { getTranslation } from '../i18n/translations';

export default function GovernmentHeader({
  currentUser,
  onSignIn,
  onRegister,
  onSignOut,
  onGoHome,
  activeNav = 'home',
  onNavClick,
  lang = 'en',
  onToggleLang,
}) {
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1: small, 0: default, 1: large
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFontChange = (level) => {
    setFontSizeLevel(level);
    const root = document.documentElement;
    if (level === -1) {
      root.style.fontSize = '90%';
    } else if (level === 1) {
      root.style.fontSize = '110%';
    } else {
      root.style.fontSize = '100%';
    }
  };

  const handleNavSelect = (itemKey) => {
    setMobileMenuOpen(false);
    if (onNavClick) {
      onNavClick(itemKey, null);
    } else if (itemKey === 'home') {
      if (onGoHome) onGoHome();
    }
  };

  const navItems = [
    { key: 'home', label: getTranslation('navHome', lang) },
    { key: 'about', label: getTranslation('navAboutUs', lang) },
    { key: 'workflow', label: getTranslation('navWorkflow', lang) },
    { key: 'stakeholders', label: getTranslation('navStakeholders', lang) },
    { key: 'help', label: getTranslation('navHelpFaq', lang) },
  ];

  return (
    <header className="gov-header-unified" role="banner">
      {/* 1. Indian National Flag Tricolor Accent Line */}
      <div className="gov-tricolor-strip" aria-hidden="true" />

      {/* 2. Top Utility & Accessibility Bar (AICTE / Indian Gov Portal Standard) */}
      <div className="gov-top-dark-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span className="gov-gov-text">
              {lang === 'hi' ? 'भारत सरकार | शिक्षा मंत्रालय' : 'Government of India | Ministry of Education'}
            </span>
          </div>

          <div className="gov-top-bar-right">
            {/* Font size accessibility controls */}
            <div className="gov-font-size-group" aria-label="Text size options">
              <button
                type="button"
                className={`gov-font-btn ${fontSizeLevel === -1 ? 'active' : ''}`}
                onClick={() => handleFontChange(-1)}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                className={`gov-font-btn ${fontSizeLevel === 0 ? 'active' : ''}`}
                onClick={() => handleFontChange(0)}
                title="Default font size"
              >
                A
              </button>
              <button
                type="button"
                className={`gov-font-btn ${fontSizeLevel === 1 ? 'active' : ''}`}
                onClick={() => handleFontChange(1)}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            <span className="gov-top-sep" aria-hidden="true">|</span>

            {/* Screen Reader Access */}
            <button
              type="button"
              className="gov-screen-reader-btn"
              onClick={() => alert((lang === 'hi' ? 'स्क्रीन रीडर' : 'Screen Reader') + ': Enabled')}
              title={lang === 'hi' ? 'स्क्रीन रीडर' : 'Screen Reader'}
            >
              <span className="gov-screen-reader-icon" aria-hidden="true">🚹</span>
              <span>{lang === 'hi' ? 'स्क्रीन रीडर' : 'Screen Reader'}</span>
            </button>

            <span className="gov-top-sep" aria-hidden="true">|</span>

            {/* Language Switcher Button (English / हिंदी) */}
            <button
              type="button"
              className="gov-lang-badge-btn"
              onClick={onToggleLang}
              title={lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}
            >
              <span>{lang === 'en' ? 'English' : 'English'}</span>
              <span className="gov-lang-sub-sep">|</span>
              <span>{lang === 'hi' ? 'हिंदी' : 'हिंदी'}</span>
            </button>

            <span className="gov-top-sep" aria-hidden="true">|</span>
            <span className="gov-globe-icon" title="Portal Network" aria-hidden="true">🌐</span>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation & Branding Strip (Reference Image 1) */}
      <div className="gov-main-nav-strip">
        <div className="gov-main-nav-inner">
          {/* Left: Branding */}
          <div
            className="gov-brand-clickable"
            onClick={onGoHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onGoHome && onGoHome()}
            title="APAARSetu Portal Home"
          >
            <div className="gov-cap-icon-box" aria-hidden="true">
              <svg viewBox="0 0 48 40" fill="none" className="gov-mortarboard-svg">
                <polygon points="24,6 45,16 24,26 3,16" fill="#0B2545" stroke="#071930" strokeWidth="1.5" />
                <polygon points="24,10 40,16 24,23 8,16" fill="#174A78" />
                <path d="M14,21 L14,30 C14,35 34,35 34,30 L34,21" fill="#0B2545" stroke="#071930" strokeWidth="1.5" />
                <path d="M24,16 C24,20 37,22 38,27 L37,33" stroke="#F36B21" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="16" r="2" fill="#F36B21" />
                <rect x="35" y="32" width="4" height="6" rx="1" fill="#F36B21" />
              </svg>
            </div>

            <div className="gov-brand-text">
              <div className="gov-brand-title">APAARSetu</div>
              <div className="gov-brand-subtitle">
                {lang === 'hi'
                  ? 'अपार आईडी आधारित विद्यार्थी डेटा व्यवस्थापन व सत्यापन मंच'
                  : 'APAAR ID-Based Student Data Management & Verification Platform'}
              </div>
            </div>
          </div>

          {/* Right: Navigation Items + Login + Register Buttons */}
          <div className="gov-nav-and-actions">
            <nav className={`gov-main-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Primary Navigation">
              <ul className="gov-nav-menu-list">
                {navItems.map((item) => (
                  <li key={item.key} className="gov-nav-item">
                    <button
                      type="button"
                      className={`gov-nav-btn ${activeNav === item.key ? 'nav-active' : ''}`}
                      onClick={() => handleNavSelect(item.key)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="gov-nav-cta-buttons">
              {!currentUser ? (
                <>
                  <button
                    type="button"
                    className="gov-header-login-btn"
                    onClick={onSignIn}
                  >
                    <span className="gov-login-icon" aria-hidden="true">👤</span>
                    <span>{getTranslation('btnLogin', lang)}</span>
                  </button>

                  <button
                    type="button"
                    className="gov-header-register-btn"
                    onClick={onRegister || onSignIn}
                  >
                    <span className="gov-reg-icon" aria-hidden="true">🏛️</span>
                    <span>{getTranslation('btnRegisterInst', lang)}</span>
                  </button>
                </>
              ) : (
                <div className="gov-header-user-group">
                  <div className="gov-auth-chip">
                    <span className="auth-chip-role">{currentUser.role}</span>
                    <span className="auth-chip-email">{currentUser.email}</span>
                  </div>
                  <button
                    type="button"
                    className="gov-header-logout-btn"
                    onClick={onSignOut}
                  >
                    {getTranslation('navLogout', lang)}
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                className="gov-mobile-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="hamburger-bar" />
                <span className="hamburger-bar" />
                <span className="hamburger-bar" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
