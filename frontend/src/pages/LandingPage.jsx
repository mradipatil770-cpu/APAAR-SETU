import React, { useState } from 'react';

export default function LandingPage({ onGoLogin, onExploreDirectory }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoticeTab, setActiveNoticeTab] = useState('circulars');

  const dignitaries = [
    {
      name: 'Shri Dharmendra Pradhan',
      title: "Hon'ble Minister of Education",
      sub: 'Ministry of Education, Government of India',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=260',
    },
    {
      name: 'Shri Ashwini Vaishnaw',
      title: "Hon'ble Minister of Railways, Information & Broadcasting, and MeitY",
      sub: 'Ministry of Electronics and Information Technology',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=260',
    },
    {
      name: 'Prof. T. G. Sitharam',
      title: "Chairman, All India Council for Technical Education (AICTE)",
      sub: 'Apex Advisory Body for Technical Education in India',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=260',
    },
  ];

  const corePillars = [
    {
      id: 'pillar-1',
      title: 'National Identity Integration',
      subtitle: 'APAAR / ABC Registry Sync',
      desc: 'Seamless ingestion and format validation for the 12-digit Automated Permanent Academic Account Registry (APAAR ID) under the One Nation, One Student ID initiative.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-pillar-svg">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
      tag: 'Identity Trust',
    },
    {
      id: 'pillar-2',
      title: 'AICTE Intake Compliance',
      subtitle: 'Sanctioned Seat Protection',
      desc: 'Rigorous mathematical reconciliation of enrolments against approved capacity per academic discipline, safeguarding against unauthorized over-admission.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-pillar-svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      tag: 'Regulatory Rigour',
    },
    {
      id: 'pillar-3',
      title: 'Cross-Institution De-duplication',
      subtitle: 'Zero-Knowledge Blind Indexing',
      desc: 'National candidate detection flagging ghost enrolments and concurrent dual-admissions across multiple universities without exposing raw identity records.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-pillar-svg">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      tag: 'Anomaly AI',
    },
    {
      id: 'pillar-4',
      title: 'Controlled Academic Verification',
      subtitle: 'Consent-Governed Records',
      desc: 'Authorized workflow allowing corporate employers, research councils, and credential agencies to verify student status with verifiable institutional confirmation.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-pillar-svg">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 14 14" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      tag: 'Verifiable Auth',
    },
    {
      id: 'pillar-5',
      title: 'AES-256-GCM Vaulting',
      subtitle: 'Cryptographic Privacy',
      desc: 'Enterprise-grade envelope encryption at rest, column-level ciphertext storage, and HMAC-SHA-256 deterministic indexing compliant with national data standards.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-pillar-svg">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      tag: 'Data Sovereignty',
    },
  ];

  const notices = [
    {
      date: '26 Oct 2026',
      title: 'Mandatory Submission of APAAR ID Data for Academic Session 2026–27',
      category: 'Circular',
      dept: 'AICTE Bureau of Approvals & Academic Oversight',
    },
    {
      date: '22 Oct 2026',
      title: 'Guidelines for Supernumerary Intake (NRI, OCI, and Foreign National Quotas)',
      category: 'Notification',
      dept: 'Regulation & Policy Division',
    },
    {
      date: '18 Oct 2026',
      title: 'Advisory on Reconciliation of Cross-Institution Enrolment Discrepancies',
      category: 'Advisory',
      dept: 'Data Audits & Anomaly Taskforce',
    },
    {
      date: '12 Oct 2026',
      title: 'Release of APAARSetu v2.0 with Real-time Controlled Verification Support',
      category: 'Technical Update',
      dept: 'NIC / AICTE Platform Engineering',
    },
  ];

  return (
    <div className="landing-container">
      {/* 1. Official Hero Section */}
      <section className="landing-hero" aria-label="Portal Introduction">
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="landing-badge-dot" />
            <span>AICTE Problem Statement 26263 • National Academic Architecture</span>
          </div>

          <h1 className="landing-hero-title">
            Unified Framework for Student Enrolment & Academic Identity
          </h1>

          <p className="landing-hero-subtitle">
            A state-of-the-art platform connecting technical institutions, AICTE regulatory authorities,
            and authorized stakeholders to validate approved intake limits, ensure APAAR ID compliance,
            prevent duplicate enrolments, and streamline academic verification.
          </p>

          <div className="landing-hero-actions">
            <button className="gov-btn-primary landing-cta-btn" onClick={onGoLogin}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-icon">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>Sign In to Portal</span>
            </button>
            <button className="gov-btn-outline landing-cta-btn-alt" onClick={onGoLogin}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-icon">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>Central AICTE Oversight</span>
            </button>
          </div>

          {/* National Trust Highlights */}
          <div className="landing-stat-strip">
            <div className="landing-stat-item">
              <span className="landing-stat-number">10,000+</span>
              <span className="landing-stat-label">AICTE Institutions Covered</span>
            </div>
            <div className="landing-stat-sep" />
            <div className="landing-stat-item">
              <span className="landing-stat-number">100%</span>
              <span className="landing-stat-label">Deterministic Privacy Shield</span>
            </div>
            <div className="landing-stat-sep" />
            <div className="landing-stat-item">
              <span className="landing-stat-number">24/7</span>
              <span className="landing-stat-label">Real-time Intake Monitoring</span>
            </div>
            <div className="landing-stat-sep" />
            <div className="landing-stat-item">
              <span className="landing-stat-number">Zero</span>
              <span className="landing-stat-label">Data Exposure Vulnerability</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Executive Leadership & Dignitaries Strip (Styled like NIC Government Portal) */}
      <section className="gov-leadership-section">
        <div className="gov-section-header-compact">
          <h2 className="gov-section-heading">Apex Guidance & Leadership</h2>
          <div className="gov-section-rule" />
        </div>
        <div className="gov-leadership-grid">
          {dignitaries.map((person, idx) => (
            <div key={idx} className="gov-leader-card">
              <div className="gov-leader-avatar-wrap">
                <div className="gov-leader-avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="gov-leader-svg-icon">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <div className="gov-leader-info">
                <h3 className="gov-leader-name">{person.name}</h3>
                <p className="gov-leader-title">{person.title}</p>
                <span className="gov-leader-dept">{person.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Core Architectural Capabilities (Cards as in NIC Offerings) */}
      <section className="landing-pillars-section">
        <div className="gov-section-header">
          <span className="gov-section-tag">Key Offerings</span>
          <h2 className="gov-section-heading">Platform Architecture & Capabilities</h2>
          <p className="gov-section-sub">
            Engineered specifically to solve AICTE Problem Statement 26263 with institutional multi-tenancy,
            cryptographic integrity, and cross-university data reconciliation.
          </p>
        </div>

        <div className="landing-pillars-grid">
          {corePillars.map((pillar) => (
            <div key={pillar.id} className="landing-pillar-card">
              <div className="landing-pillar-top">
                <div className="landing-pillar-icon">{pillar.icon}</div>
                <span className="landing-pillar-tag">{pillar.tag}</span>
              </div>
              <h3 className="landing-pillar-title">{pillar.title}</h3>
              <div className="landing-pillar-sub">{pillar.subtitle}</div>
              <p className="landing-pillar-desc">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Split Section: Latest Circulars/Notices and Academic Calendar Widget (From NIC Portal Screenshot) */}
      <section className="gov-split-info-section">
        <div className="gov-notices-container">
          <div className="gov-split-header">
            <h3 className="gov-split-title">What's New & Circulars</h3>
            <div className="gov-notices-tabs">
              <button
                className={`gov-tab-mini ${activeNoticeTab === 'circulars' ? 'active' : ''}`}
                onClick={() => setActiveNoticeTab('circulars')}
              >
                Circulars
              </button>
              <button
                className={`gov-tab-mini ${activeNoticeTab === 'guidelines' ? 'active' : ''}`}
                onClick={() => setActiveNoticeTab('guidelines')}
              >
                AICTE Guidelines
              </button>
            </div>
          </div>

          <div className="gov-notices-list">
            {notices.map((n, i) => (
              <div key={i} className="gov-notice-card">
                <div className="gov-notice-date-box">
                  <span className="gov-notice-day">{n.date.split(' ')[0]}</span>
                  <span className="gov-notice-mo">{n.date.split(' ')[1]}</span>
                </div>
                <div className="gov-notice-content">
                  <div className="gov-notice-meta">
                    <span className="gov-notice-badge">{n.category}</span>
                    <span className="gov-notice-dept">{n.dept}</span>
                  </div>
                  <h4 className="gov-notice-title">{n.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar & Compliance Milestones Widget */}
        <div className="gov-calendar-container">
          <div className="gov-split-header">
            <h3 className="gov-split-title">Academic Schedule (Session 2026–27)</h3>
            <span className="gov-month-tag">October 2026</span>
          </div>

          <div className="gov-schedule-box">
            <div className="gov-milestone-item active">
              <div className="gov-milestone-indicator" />
              <div className="gov-milestone-detail">
                <span className="gov-milestone-date">Current Stage • 15 Oct – 31 Oct</span>
                <span className="gov-milestone-heading">Phase-I Institutional Ingestion & Verification</span>
                <span className="gov-milestone-desc">Mandatory batch submission of first-year technical enrolments.</span>
              </div>
            </div>

            <div className="gov-milestone-item">
              <div className="gov-milestone-indicator pending" />
              <div className="gov-milestone-detail">
                <span className="gov-milestone-date">Upcoming • 01 Nov – 15 Nov</span>
                <span className="gov-milestone-heading">Central AICTE De-duplication Scan</span>
                <span className="gov-milestone-desc">Automated cross-institution duplicate candidate reconciliation.</span>
              </div>
            </div>

            <div className="gov-milestone-item">
              <div className="gov-milestone-indicator pending" />
              <div className="gov-milestone-detail">
                <span className="gov-milestone-date">Upcoming • 16 Nov – 30 Nov</span>
                <span className="gov-milestone-heading">Final Intake Reconciliation & Seat Lock</span>
                <span className="gov-milestone-desc">Issuance of AICTE National Enrolment Integrity Certificates.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. National Portal Partner Banner Strip (As shown in screenshot) */}
      <section className="gov-partners-ribbon" aria-label="Government Portals Network">
        <div className="gov-partners-inner">
          <span className="gov-partners-label">Supported Government Digital Initiatives:</span>
          <div className="gov-partners-list">
            <div className="gov-partner-pill">
              <strong>Digital India</strong>
              <span>Power To Empower</span>
            </div>
            <div className="gov-partner-pill">
              <strong>@gov.in</strong>
              <span>National Identity</span>
            </div>
            <div className="gov-partner-pill">
              <strong>MeitY</strong>
              <span>Govt. of India</span>
            </div>
            <div className="gov-partner-pill">
              <strong>myGov</strong>
              <span>Meri Sarkar</span>
            </div>
            <div className="gov-partner-pill">
              <strong>NKN</strong>
              <span>National Knowledge Net</span>
            </div>
            <div className="gov-partner-pill">
              <strong>ServicePlus</strong>
              <span>Service Delivery</span>
            </div>
            <div className="gov-partner-pill">
              <strong>SwaaS</strong>
              <span>Secure Cloud</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

