import React, { useState } from 'react';
import { getTranslation } from '../i18n/translations';

export default function LandingPage({ onGoLogin, lang = 'en' }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const services = [
    {
      id: 'intake',
      title: getTranslation('service1Title', lang),
      desc: getTranslation('service1Desc', lang),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-icon-svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      specs: [
        'Sanctioned limits by discipline (UG Engineering, PG, MCA, Management)',
        'Automatic utilization rate calculation and seat threshold tracking',
        'Direct penalty alerts for excess admissions beyond approved ceiling',
      ],
    },
    {
      id: 'ingestion',
      title: getTranslation('service2Title', lang),
      desc: getTranslation('service2Desc', lang),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-icon-svg">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      specs: [
        'Deterministic validation of 12-digit numeric APAAR identifiers',
        'Mandatory header integrity checks and CSV formula escaping',
        'SHA-256 batch cryptographic checksums to prevent duplicate uploads',
      ],
    },
    {
      id: 'collision',
      title: getTranslation('service3Title', lang),
      desc: getTranslation('service3Desc', lang),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-icon-svg">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      specs: [
        'Cross-institutional multi-enrolment detection across all AICTE institutes',
        'Privacy-preserving blinded token comparison',
        'Regulatory workflow for resolution with audit timestamping',
      ],
    },
    {
      id: 'transfers',
      title: getTranslation('service4Title', lang),
      desc: getTranslation('service4Desc', lang),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-icon-svg">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
      specs: [
        'Releasing institute digital NOC generation',
        'Receiving institute quota availability check and acceptance',
        'Central AICTE Bureau endorsement for regulatory finality',
      ],
    },
    {
      id: 'reports',
      title: getTranslation('service5Title', lang),
      desc: getTranslation('service5Desc', lang),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-icon-svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      specs: [
        'Institutional compliance certificates with seat breakdown',
        'National intake analytics by state, category, and discipline',
        'Direct export to standard PDF and CSV formats',
      ],
    },
  ];

  return (
    <div className="mahadbt-landing-root">
      {/* 1. MahaDBT-Style Top Red Notification Banner */}
      <div className="mahadbt-alert-ticker" role="region" aria-label="Portal Directive">
        <div className="mahadbt-alert-ticker-inner">
          <span className="mahadbt-alert-badge">Notice</span>
          <span className="mahadbt-alert-text">
            {getTranslation('tickerNotice', lang)}
          </span>
        </div>
      </div>

      {/* 2. Three-Column Administrative Portal Grid (Modeled on MahaDBT / NIC Reference) */}
      <div className="mahadbt-layout-grid">
        {/* Left Column: Guidelines, Policy Directives & Notice Board */}
        <aside className="mahadbt-col-left" aria-label="Guidelines and Notices">
          {/* Important Guidelines Links */}
          <div className="mahadbt-panel">
            <div className="mahadbt-panel-header primary-blue">
              <h3>{getTranslation('userManualsTitle', lang)}</h3>
            </div>
            <div className="mahadbt-guidelines-list">
              <a href="#guidelines-intake" className="mahadbt-guide-item" onClick={(e) => { e.preventDefault(); }}>
                <span className="guide-icon">📋</span>
                <span className="guide-label">{getTranslation('guidelinesIntake', lang)}</span>
              </a>
              <a href="#guidelines-apaar" className="mahadbt-guide-item" onClick={(e) => { e.preventDefault(); }}>
                <span className="guide-icon">🆔</span>
                <span className="guide-label">{getTranslation('guidelinesApaar', lang)}</span>
              </a>
              <a href="#guidelines-transfers" className="mahadbt-guide-item" onClick={(e) => { e.preventDefault(); }}>
                <span className="guide-icon">🔄</span>
                <span className="guide-label">{getTranslation('guidelinesTransfers', lang)}</span>
              </a>
              <a href="#guidelines-courses" className="mahadbt-guide-item" onClick={(e) => { e.preventDefault(); }}>
                <span className="guide-icon">🏛️</span>
                <span className="guide-label">{getTranslation('guidelinesCourses', lang)}</span>
              </a>
            </div>
          </div>

          {/* Official Notice Board */}
          <div className="mahadbt-panel">
            <div className="mahadbt-panel-header warning-orange">
              <div className="panel-title-with-icon">
                <span className="header-bell-icon">🔔</span>
                <h3>{getTranslation('noticeBoardTitle', lang)}</h3>
              </div>
            </div>
            <div className="mahadbt-notice-list">
              <div className="mahadbt-notice-item">
                <span className="notice-bullet">•</span>
                <div className="notice-content">
                  <strong className="notice-heading">{getTranslation('notice1Title', lang)}</strong>
                  <p className="notice-desc">{getTranslation('notice1Body', lang)}</p>
                </div>
              </div>
              <div className="mahadbt-notice-item">
                <span className="notice-bullet">•</span>
                <div className="notice-content">
                  <strong className="notice-heading">{getTranslation('notice2Title', lang)}</strong>
                  <p className="notice-desc">{getTranslation('notice2Body', lang)}</p>
                </div>
              </div>
              <div className="mahadbt-notice-item">
                <span className="notice-bullet">•</span>
                <div className="notice-content">
                  <strong className="notice-heading">{getTranslation('notice3Title', lang)}</strong>
                  <p className="notice-desc">{getTranslation('notice3Body', lang)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Regulatory Compliance Box */}
          <div className="mahadbt-panel compliance-box">
            <div className="compliance-inner">
              <div className="compliance-shield">🛡️</div>
              <div className="compliance-text">
                <strong>Standard IT & Data Security</strong>
                <p>Protected under Government of India data privacy guidelines & AICTE technical directives.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Portal Introduction & Service Registry Modules */}
        <section className="mahadbt-col-center" aria-label="Services and Modules">
          {/* Administrative Overview Header */}
          <div className="mahadbt-center-hero">
            <div className="hero-kicker">
              <span>{getTranslation('aicteBureau', lang)}</span>
            </div>
            <h1 className="hero-main-title">
              {getTranslation('landingHeroTitle', lang)}
            </h1>
            <p className="hero-main-desc">
              {getTranslation('landingHeroDesc', lang)}
            </p>
            <div className="hero-action-row">
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                onClick={onGoLogin}
              >
                <span>{getTranslation('applicantLogin', lang)}</span>
                <span className="btn-arrow">→</span>
              </button>
              <button
                type="button"
                className="gov-btn gov-btn-secondary"
                onClick={onGoLogin}
              >
                <span>{getTranslation('newRegistration', lang)}</span>
              </button>
            </div>
          </div>

          {/* Department / Service Registry Modules (MahaDBT "All Schemes" Accordion Style) */}
          <div className="mahadbt-schemes-container">
            <div className="schemes-header-bar">
              <span className="schemes-bar-icon">🏛️</span>
              <h2>{getTranslation('servicesHeading', lang)}</h2>
            </div>

            <div className="schemes-accordion-list">
              {services.map((srv) => {
                const isOpen = expandedSection === srv.id;
                return (
                  <div key={srv.id} className={`scheme-accordion-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="scheme-accordion-trigger"
                      onClick={() => toggleSection(srv.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="trigger-left">
                        <span className="scheme-icon-wrap">{srv.icon}</span>
                        <span className="scheme-title-text">{srv.title}</span>
                      </div>
                      <span className="trigger-toggle-indicator">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="scheme-accordion-body">
                        <p className="scheme-body-desc">{srv.desc}</p>
                        <ul className="scheme-specs-list">
                          {srv.specs.map((item, idx) => (
                            <li key={idx}>
                              <span className="spec-check">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Portal Services & Direct Access Links */}
        <aside className="mahadbt-col-right" aria-label="Portal Action Services">
          {/* Quick Access Action Cards */}
          <div className="mahadbt-panel action-links-panel">
            <div className="mahadbt-panel-header action-header">
              <h3>{getTranslation('quickLinksTitle', lang)}</h3>
            </div>
            <div className="mahadbt-action-menu">
              <button
                type="button"
                className="mahadbt-action-btn register-action"
                onClick={onGoLogin}
              >
                <span className="action-btn-icon">📝</span>
                <span className="action-btn-label">{getTranslation('newRegistration', lang)}</span>
              </button>
              <button
                type="button"
                className="mahadbt-action-btn login-action"
                onClick={onGoLogin}
              >
                <span className="action-btn-icon">🔐</span>
                <span className="action-btn-label">{getTranslation('applicantLogin', lang)}</span>
              </button>
              <button
                type="button"
                className="mahadbt-action-btn central-action"
                onClick={onGoLogin}
              >
                <span className="action-btn-icon">🏛️</span>
                <span className="action-btn-label">{getTranslation('centralLogin', lang)}</span>
              </button>
              <button
                type="button"
                className="mahadbt-action-btn track-action"
                onClick={onGoLogin}
              >
                <span className="action-btn-icon">🔍</span>
                <span className="action-btn-label">{getTranslation('trackApplication', lang)}</span>
              </button>
            </div>
          </div>

          {/* User Manuals & Guidelines Download Box */}
          <div className="mahadbt-panel manuals-panel">
            <div className="mahadbt-panel-header gray-header">
              <div className="panel-title-with-icon">
                <span className="header-doc-icon">📖</span>
                <h3>{getTranslation('userManualsTitle', lang)}</h3>
              </div>
            </div>
            <div className="mahadbt-manuals-list">
              <div className="manual-item">
                <span className="pdf-icon">📄</span>
                <span className="manual-text">AICTE Ingestion User Manual (AY 2026-27)</span>
              </div>
              <div className="manual-item">
                <span className="pdf-icon">📄</span>
                <span className="manual-text">CSV Data Format & APAAR ID Schema</span>
              </div>
              <div className="manual-item">
                <span className="pdf-icon">📄</span>
                <span className="manual-text">Inter-Institutional Transfer SOP</span>
              </div>
              <div className="manual-item">
                <span className="pdf-icon">📄</span>
                <span className="manual-text">Supernumerary Quota Verification Rules</span>
              </div>
            </div>
          </div>

          {/* FAQ & Citizen Charter */}
          <div className="mahadbt-panel support-panel">
            <div className="support-links-group">
              <div className="support-link-item">
                <span className="support-icon">❓</span>
                <span className="support-title">{getTranslation('faqTitle', lang)}</span>
              </div>
              <div className="support-link-item">
                <span className="support-icon">👥</span>
                <span className="support-title">{getTranslation('citizenCharter', lang)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
