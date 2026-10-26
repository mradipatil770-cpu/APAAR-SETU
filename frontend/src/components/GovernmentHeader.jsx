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

  const handleNavItemClick = (itemKey) => {
    if (onNavClick) {
      onNavClick(itemKey);
    } else if (itemKey === 'home') {
      if (onGoHome) onGoHome();
    } else {
      const el = document.getElementById(itemKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="gov-official-header-root" role="banner">
      {/* 1. Top Utility Strip (Exact dark blue matching reference screenshot) */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span className="gov-hindi-ministry-title">
              {getTranslation('landingGovIndiaTop', lang)}
            </span>
          </div>

          <div className="gov-top-bar-right">
            {/* Font size accessibility adjustment */}
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

            {/* Screen Reader Access link/button */}
            <button
              type="button"
              className="gov-screen-reader-btn"
              onClick={() => alert(getTranslation('screenReader', lang) + ': Enabled')}
              title={getTranslation('screenReader', lang)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-icon-svg" aria-hidden="true">
                <circle cx="12" cy="4" r="2" />
                <path d="M15 8h-6v7m3-4v9" />
              </svg>
              <span>{lang === 'hi' ? 'स्क्रीन रीडर' : 'Screen Reader'}</span>
            </button>

            <span className="gov-top-sep" aria-hidden="true">|</span>

            {/* Language Switcher English | हिंदी */}
            <button
              type="button"
              className="gov-lang-switch-btn"
              onClick={onToggleLang}
              title={lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
            >
              <span className={lang === 'en' ? 'lang-active' : 'lang-inactive'}>English</span>
              <span className="lang-sep">|</span>
              <span className={lang === 'hi' ? 'lang-active' : 'lang-inactive'}>हिंदी</span>
            </button>

            {/* Globe Icon */}
            <span className="gov-globe-icon" aria-hidden="true" title="Language selection">
              🌐
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main White Navigation Header */}
      <div className="gov-main-nav-bar">
        <div className="gov-main-nav-inner">
          {/* Left Brand with Graduation Cap Logo */}
          <div
            className="gov-brand-clickable"
            onClick={onGoHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onGoHome && onGoHome()}
            title="APAARSetu Home"
          >
            <div className="gov-cap-icon-box" aria-hidden="true">
              <svg viewBox="0 0 48 40" fill="none" className="gov-mortarboard-svg">
                {/* Mortarboard Cap */}
                <polygon points="24,6 45,16 24,26 3,16" fill="#0b2545" stroke="#071930" strokeWidth="1.5" />
                <polygon points="24,10 40,16 24,23 8,16" fill="#174A78" />
                {/* Cap Base */}
                <path d="M14,21 L14,30 C14,35 34,35 34,30 L34,21" fill="#0b2545" stroke="#071930" strokeWidth="1.5" />
                {/* Tassel */}
                <path d="M24,16 C24,20 37,22 38,27 L37,33" stroke="#f26a1b" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="16" r="2" fill="#f26a1b" />
                <rect x="35" y="32" width="4" height="6" rx="1" fill="#f26a1b" />
              </svg>
            </div>

            <div className="gov-brand-text">
              <div className="gov-brand-title">APAARSetu</div>
              <div className="gov-brand-subtitle">
                {getTranslation('platformSubtitle', lang)}
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Exact items from screenshot) */}
          <nav className="gov-center-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`gov-nav-link ${activeNav === 'home' ? 'nav-active' : ''}`}
              onClick={() => handleNavItemClick('home')}
            >
              {getTranslation('navHome', lang)}
            </button>
            <button
              type="button"
              className={`gov-nav-link ${activeNav === 'about' ? 'nav-active' : ''}`}
              onClick={() => handleNavItemClick('about')}
            >
              {getTranslation('navAbout', lang)}
            </button>
            <button
              type="button"
              className={`gov-nav-link ${activeNav === 'workflow' ? 'nav-active' : ''}`}
              onClick={() => handleNavItemClick('workflow')}
            >
              {getTranslation('navWorkflow', lang)}
            </button>
            <button
              type="button"
              className={`gov-nav-link ${activeNav === 'stakeholders' ? 'nav-active' : ''}`}
              onClick={() => handleNavItemClick('stakeholders')}
            >
              {getTranslation('navStakeholders', lang)}
            </button>
            <button
              type="button"
              className={`gov-nav-link ${activeNav === 'help' ? 'nav-active' : ''}`}
              onClick={() => handleNavItemClick('help')}
            >
              {getTranslation('navHelpFaq', lang)}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="gov-right-actions">
            {!currentUser ? (
              <div className="gov-auth-btns-row">
                {/* 1. Login button: White bg, navy border */}
                <button
                  type="button"
                  className="gov-btn-login-outline"
                  onClick={onSignIn}
                >
                  <span className="gov-btn-ico" aria-hidden="true">👤</span>
                  <span>{getTranslation('btnLogin', lang)}</span>
                </button>

                {/* 2. Register Institution button: Vibrant orange background */}
                <button
                  type="button"
                  className="gov-btn-register-solid"
                  onClick={onRegister || onSignIn}
                >
                  <span className="gov-btn-ico" aria-hidden="true">🏛️</span>
                  <span>{getTranslation('btnRegisterInst', lang)}</span>
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
