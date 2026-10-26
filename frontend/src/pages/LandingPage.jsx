import React from 'react';
import { getTranslation } from '../i18n/translations';

export default function LandingPage({ onGoLogin, onGoRegister, lang = 'en' }) {
  const handleRegisterClick = () => {
    if (onGoRegister) {
      onGoRegister();
    } else if (onGoLogin) {
      onGoLogin();
    }
  };

  const handleScrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="gov-new-landing-wrapper">
      {/* 1. Hero Section (Split Layout: Text & CTA on Left, Indian Students Photo on Right) */}
      <section className="gov-hero-split-section" aria-labelledby="hero-title" id="home">
        <div className="gov-hero-split-container">
          {/* Left Text Block */}
          <div className="gov-hero-left-col">
            <h1 id="hero-title" className="gov-hero-title-bold">
              {getTranslation('heroMainTitle', lang)}
            </h1>
            <h2 className="gov-hero-subtitle-primary">
              {getTranslation('heroSubTitle', lang)}
            </h2>
            <p className="gov-hero-description">
              {getTranslation('heroDesc', lang)}
            </p>

            {/* Action CTA Buttons */}
            <div className="gov-hero-cta-group">
              <button
                type="button"
                className="gov-hero-btn-orange"
                onClick={handleRegisterClick}
              >
                <span className="gov-btn-icon-span" aria-hidden="true">🏛️</span>
                <span>{getTranslation('btnRegisterInst', lang)}</span>
              </button>

              <button
                type="button"
                className="gov-hero-btn-white"
                onClick={onGoLogin}
              >
                <span className="gov-btn-icon-span" aria-hidden="true">👤</span>
                <span>{getTranslation('btnLogin', lang)}</span>
              </button>
            </div>
          </div>

          {/* Right Photographic Image Block */}
          <div className="gov-hero-right-col" aria-hidden="true">
            <div className="gov-hero-image-frame">
              <img
                src="/assets/hero-students.jpg"
                alt="Students collaborating on campus with laptops"
                className="gov-hero-student-photo"
                onError={(e) => {
                  // Fallback to stylized SVG card if image file is not found
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div className="gov-hero-img-fallback" style={{ display: 'none' }}>
                <svg viewBox="0 0 100 80" className="gov-fallback-svg">
                  <rect width="100" height="80" fill="#e2e8f0" rx="8" />
                  <circle cx="50" cy="30" r="14" fill="#0b2545" />
                  <path d="M25 65 C25 45 75 45 75 65" fill="#1769AA" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "How It Helps Institutions" Section */}
      <section className="gov-how-it-helps-section" aria-labelledby="how-it-helps-heading" id="workflow">
        <div className="gov-section-header">
          <h2 id="how-it-helps-heading" className="gov-section-main-heading">
            {getTranslation('howItHelpsTitle', lang)}
          </h2>
          <p className="gov-section-sub-heading">
            {getTranslation('howItHelpsSub', lang)}
          </p>
        </div>

        <div className="gov-helps-content-layout">
          {/* Left: 6 Feature Cards Grid (2 cols x 3 rows) */}
          <div className="gov-features-grid-left">
            {/* 1. Data Submission & Validation */}
            <div className="gov-feature-card" onClick={onGoLogin} role="button" tabIndex={0}>
              <div className="gov-card-icon-bubble bubble-blue" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-card-svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="gov-card-body">
                <h3 className="gov-card-title">{getTranslation('card1Title', lang)}</h3>
                <p className="gov-card-text">{getTranslation('card1Desc', lang)}</p>
              </div>
            </div>

            {/* 2. Intake Compliance */}
            <div className="gov-feature-card" onClick={onGoLogin} role="button" tabIndex={0}>
              <div className="gov-card-icon-bubble bubble-green" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-card-svg">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div className="gov-card-body">
                <h3 className="gov-card-title">{getTranslation('card2Title', lang)}</h3>
                <p className="gov-card-text">{getTranslation('card2Desc', lang)}</p>
              </div>
            </div>

            {/* 3. Duplicate Record Review */}
            <div className="gov-feature-card" onClick={onGoLogin} role="button" tabIndex={0}>
              <div className="gov-card-icon-bubble bubble-purple" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-card-svg">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <div className="gov-card-body">
                <h3 className="gov-card-title">{getTranslation('card3Title', lang)}</h3>
                <p className="gov-card-text">{getTranslation('card3Desc', lang)}</p>
              </div>
            </div>

            {/* 4. Student Transfers */}
            <div className="gov-feature-card" onClick={onGoLogin} role="button" tabIndex={0}>
              <div className="gov-card-icon-bubble bubble-orange" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-card-svg">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              <div className="gov-card-body">
                <h3 className="gov-card-title">{getTranslation('card4Title', lang)}</h3>
                <p className="gov-card-text">{getTranslation('card4Desc', lang)}</p>
              </div>
            </div>

            {/* 5. Authorized Verification */}
            <div className="gov-feature-card" onClick={onGoLogin} role="button" tabIndex={0}>
              <div className="gov-card-icon-bubble bubble-teal" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-card-svg">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  <polyline points="9 8 11 10 15 6" />
                </svg>
              </div>
              <div className="gov-card-body">
                <h3 className="gov-card-title">{getTranslation('card5Title', lang)}</h3>
                <p className="gov-card-text">{getTranslation('card5Desc', lang)}</p>
              </div>
            </div>

            {/* 6. Reports & Monitoring */}
            <div className="gov-feature-card" onClick={onGoLogin} role="button" tabIndex={0}>
              <div className="gov-card-icon-bubble bubble-blue-alt" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-card-svg">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                  <line x1="2" y1="20" x2="22" y2="20" />
                </svg>
              </div>
              <div className="gov-card-body">
                <h3 className="gov-card-title">{getTranslation('card6Title', lang)}</h3>
                <p className="gov-card-text">{getTranslation('card6Desc', lang)}</p>
              </div>
            </div>
          </div>

          {/* Right: Spotlight Container */}
          <div className="gov-spotlight-right-box" id="about">
            <div className="gov-spotlight-inner">
              <div className="gov-spotlight-icon" aria-hidden="true">
                <span className="gov-spotlight-pillar-icon">🏛️</span>
              </div>
              <h3 className="gov-spotlight-title">
                {getTranslation('spotlightTitle', lang)}
              </h3>
              <p className="gov-spotlight-desc">
                {getTranslation('spotlightDesc', lang)}
              </p>
              <button
                type="button"
                className="gov-spotlight-btn"
                onClick={handleRegisterClick}
              >
                <span>{getTranslation('knowMoreBtn', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "Our Key Stakeholders" Section */}
      <section className="gov-stakeholders-section" aria-labelledby="stakeholders-heading" id="stakeholders">
        <div className="gov-stakeholders-strip">
          <div className="gov-stakeholders-label">
            <span id="stakeholders-heading">{getTranslation('stakeholdersTitle', lang)}</span>
          </div>

          <div className="gov-stakeholders-items">
            {/* Stakeholder 1: Ministry of Education */}
            <div className="gov-stakeholder-item">
              <img
                src="/assets/stakeholder-moe.png"
                alt="Ministry of Education Government of India"
                className="gov-stakeholder-img"
              />
            </div>

            <div className="gov-stakeholder-divider" aria-hidden="true" />

            {/* Stakeholder 2: AICTE */}
            <div className="gov-stakeholder-item">
              <img
                src="/assets/stakeholder-aicte.png"
                alt="All India Council for Technical Education"
                className="gov-stakeholder-img"
              />
            </div>

            <div className="gov-stakeholder-divider" aria-hidden="true" />

            {/* Stakeholder 3: MoE's Innovation Cell */}
            <div className="gov-stakeholder-item">
              <img
                src="/assets/stakeholder-mic.png"
                alt="MoE's Innovation Cell Government of India"
                className="gov-stakeholder-img"
              />
            </div>

            <div className="gov-stakeholder-divider" aria-hidden="true" />

            {/* Stakeholder 4: National Informatics Centre */}
            <div className="gov-stakeholder-item">
              <img
                src="/assets/stakeholder-nic.png"
                alt="National Informatics Centre"
                className="gov-stakeholder-img"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
