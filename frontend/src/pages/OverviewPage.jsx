import React, { useState } from 'react';
import { getTranslation } from '../i18n/translations';

export default function OverviewPage({
  dashboardData,
  loading,
  onSelectUpload,
  onNavigateUpload,
  onNavigateTab,
  currentUser,
  lang = 'en',
}) {
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [selectedProgramme, setSelectedProgramme] = useState('B.Tech CSE');
  const isPending = currentUser?.institution_status === 'PENDING_VERIFICATION';

  const navigateTo = (tab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (tab === 'upload' && onNavigateUpload) {
      onNavigateUpload();
    }
  };

  if (loading) {
    return (
      <div className="gov-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div className="gov-spinner" aria-hidden="true" />
        <p style={{ color: '#64748B', marginTop: '12px' }}>{getTranslation('loadingText', lang)}</p>
      </div>
    );
  }

  // Calculate genuine stats based on real database records (0 by default)
  const totalStudents = dashboardData?.total_accepted_records ?? dashboardData?.total_processed_records ?? 0;
  const validatedStudents = dashboardData?.total_accepted_records ?? 0;
  const pendingIssues = (dashboardData?.open_anomaly_count ?? 0) + (dashboardData?.intake_discrepancy_count ?? 0);
  const criticalAnomalies = dashboardData?.open_anomaly_count ?? 0;

  // Validation Status rows reflecting genuine state
  const validationItems = [
    {
      label: lang === 'hi' ? 'संस्थान प्रोफाइल सत्यापन' : 'Institution Profile Verification',
      status: isPending ? (lang === 'hi' ? 'प्रक्रियाधीन' : 'Pending Review') : (lang === 'hi' ? 'सत्यापित (पूर्ण)' : 'Complete'),
      type: isPending ? 'warning' : 'complete',
    },
    {
      label: lang === 'hi' ? 'स्वीकृत प्रवेश कोटा अनुपालन' : 'Approved Intake Quota Check',
      status: (dashboardData?.intake_discrepancy_count ?? 0) > 0
        ? (lang === 'hi' ? 'कार्रवाई आवश्यक' : 'Action Required')
        : totalStudents > 0
          ? (lang === 'hi' ? 'स्वीकृत (पूर्ण)' : 'Complete')
          : (lang === 'hi' ? 'कोई रिकॉर्ड नहीं' : 'No Records'),
      type: (dashboardData?.intake_discrepancy_count ?? 0) > 0 ? 'warning' : totalStudents > 0 ? 'complete' : 'pending',
    },
    {
      label: lang === 'hi' ? 'विद्यार्थी डेटा अपलोड' : 'Student Data Upload',
      status: totalStudents > 0
        ? (lang === 'hi' ? 'अपलोड पूर्ण' : 'Complete')
        : (lang === 'hi' ? 'कार्रवाई आवश्यक' : 'Action Required'),
      type: totalStudents > 0 ? 'complete' : 'warning',
    },
    {
      label: lang === 'hi' ? 'दोहरी प्रविष्टि समीक्षा' : 'Duplicate Enrolment Check',
      status: criticalAnomalies > 0
        ? (lang === 'hi' ? `${criticalAnomalies} विसंगतियां` : `${criticalAnomalies} Open Issues`)
        : totalStudents > 0
          ? (lang === 'hi' ? 'सत्यापित (पूर्ण)' : 'Complete')
          : (lang === 'hi' ? 'कोई रिकॉर्ड नहीं' : 'No Records'),
      type: criticalAnomalies > 0 ? 'warning' : totalStudents > 0 ? 'complete' : 'pending',
    },
    {
      label: lang === 'hi' ? 'स्थानांतरण एनओसी अनुरोध' : 'Transfer NOC Requests',
      status: lang === 'hi' ? '0 लंबित' : '0 Pending',
      type: 'complete',
    },
  ];

  const instName = dashboardData?.institution_name || currentUser?.institution_name || 'KIT College of Engineering, Kolhapur';

  return (
    <div className="gov-inst-overview">
      {/* 1. Breadcrumb & Official Page Header */}
      <div className="gov-inst-page-header">
        <div className="gov-inst-header-left">
          <nav className="gov-breadcrumb" aria-label="Breadcrumb">
            <span>{lang === 'hi' ? 'होम' : 'Home'}</span>
            <span className="breadcrumb-sep">&gt;</span>
            <span>{lang === 'hi' ? 'संस्थान पोर्टल' : 'Institutional Portal'}</span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-active">{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
          </nav>
          <h1 className="gov-inst-title">{lang === 'hi' ? 'संस्थान डैशबोर्ड' : 'Institutional Dashboard'}</h1>
          <div className="gov-inst-welcome">
            {lang === 'hi' ? 'स्वागत है' : 'Welcome'}, <strong>{instName}</strong>
          </div>
          <p className="gov-inst-desc">
            {lang === 'hi'
              ? 'संस्थागत छात्र रिकॉर्ड प्रबंधित करें, नामांकन जानकारी की निगरानी करें और लंबित सत्यापन गतिविधियों की समीक्षा करें।'
              : 'Manage institutional student records, monitor enrolment information and review pending verification activities.'}
          </p>
        </div>

        <div className="gov-inst-header-right">
          <div className="academic-year-select-wrap">
            <label htmlFor="inst-academic-year" className="academic-year-label">
              {lang === 'hi' ? 'शैक्षणिक सत्र:' : 'Academic Session:'}
            </label>
            <select
              id="inst-academic-year"
              className="academic-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2026-27">AY 2026 - 27</option>
              <option value="2025-26">AY 2025 - 26</option>
            </select>
          </div>
          <span className={`gov-status-pill ${isPending ? 'pending' : 'active'}`}>
            <span className="pill-dot">●</span>
            <span>{isPending ? (lang === 'hi' ? 'प्रक्रियाधीन सत्यापन' : 'Pending Verification') : (lang === 'hi' ? 'सक्रिय एवं अनुमोदित' : 'Approved & Active')}</span>
          </span>
        </div>
      </div>

      {/* 2. Four Compact White Metric Cards (Thin Grey Border) */}
      <section className="gov-inst-stat-grid" aria-label="Key Enrolment Metrics">
        {/* Metric 1: Total Students */}
        <article className="gov-inst-stat-card" onClick={() => navigateTo('student-records')} role="button" tabIndex={0}>
          <div className="stat-card-title">{lang === 'hi' ? 'कुल छात्र' : 'Total Students'}</div>
          <div className="stat-card-number">{totalStudents.toLocaleString()}</div>
          <div className="stat-card-sub">{lang === 'hi' ? 'सत्यापित नामांकित छात्र' : 'Authoritative Enrolled Students'}</div>
        </article>

        {/* Metric 2: Pending Issues */}
        <article className="gov-inst-stat-card" onClick={() => navigateTo('anomalies')} role="button" tabIndex={0}>
          <div className="stat-card-title">{lang === 'hi' ? 'लंबित / विसंगतियां' : 'Pending / Issues'}</div>
          <div className={`stat-card-number ${pendingIssues > 0 ? 'text-amber' : ''}`}>
            {pendingIssues.toLocaleString()}
          </div>
          <div className="stat-card-sub">{lang === 'hi' ? 'समीक्षा हेतु लंबित मामले' : 'Awaiting Institutional Review'}</div>
        </article>

        {/* Metric 3: Validated Students */}
        <article className="gov-inst-stat-card" onClick={() => navigateTo('student-records')} role="button" tabIndex={0}>
          <div className="stat-card-title">{lang === 'hi' ? 'सत्यापित छात्र' : 'Validated Students'}</div>
          <div className="stat-card-number text-green">{validatedStudents.toLocaleString()}</div>
          <div className="stat-card-sub">{lang === 'hi' ? 'अपार एवं कोटा सत्यापित' : 'APAAR & Intake Compliant'}</div>
        </article>

        {/* Metric 4: Critical Anomalies */}
        <article className="gov-inst-stat-card" onClick={() => navigateTo('anomalies')} role="button" tabIndex={0}>
          <div className="stat-card-title">{lang === 'hi' ? 'गंभीर / विसंगतियां' : 'Critical / Anomalies'}</div>
          <div className={`stat-card-number ${criticalAnomalies > 0 ? 'text-red' : ''}`}>
            {criticalAnomalies.toLocaleString()}
          </div>
          <div className="stat-card-sub">{lang === 'hi' ? 'तत्काल कार्रवाई आवश्यक' : 'Immediate Action Required'}</div>
        </article>
      </section>

      {/* 3. Four Quick Action Shortcuts */}
      <section className="gov-quick-actions-section" aria-label="Quick Actions">
        <div className="quick-actions-header">
          <h2 className="quick-actions-title">{lang === 'hi' ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions'}</h2>
          <p className="quick-actions-subtitle">
            {lang === 'hi'
              ? 'प्राथमिक संस्थागत कार्यों के लिए सीधे अनुभाग पर जाएं।'
              : 'Direct shortcuts for essential institutional registrar operations.'}
          </p>
        </div>

        <div className="gov-quick-actions-grid">
          {/* Action 1: Upload Student Data */}
          <div
            className="gov-quick-action-card"
            onClick={() => navigateTo('upload')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigateTo('upload')}
          >
            <div className="quick-action-icon text-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="12" />
                <line x1="15" y1="15" x2="12" y2="12" />
              </svg>
            </div>
            <h3 className="quick-action-label">{lang === 'hi' ? 'छात्र डेटा अपलोड' : 'Upload Student Data'}</h3>
          </div>

          {/* Action 2: View Student Records */}
          <div
            className="gov-quick-action-card"
            onClick={() => navigateTo('student-records')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigateTo('student-records')}
          >
            <div className="quick-action-icon text-teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="quick-action-label">{lang === 'hi' ? 'छात्र रिकॉर्ड देखें' : 'View Student Records'}</h3>
          </div>

          {/* Action 3: Verification & Validation */}
          <div
            className="gov-quick-action-card"
            onClick={() => navigateTo('anomalies')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigateTo('anomalies')}
          >
            <div className="quick-action-icon text-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="quick-action-label">{lang === 'hi' ? 'सत्यापन एवं विसंगतियां' : 'Verification & Validation'}</h3>
          </div>

          {/* Action 4: Student Transfers & NOC */}
          <div
            className="gov-quick-action-card"
            onClick={() => navigateTo('transfers')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigateTo('transfers')}
          >
            <div className="quick-action-icon text-orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </div>
            <h3 className="quick-action-label">{lang === 'hi' ? 'छात्र स्थानांतरण एवं एनओसी' : 'Student Transfers & NOC'}</h3>
          </div>
        </div>
      </section>

      {/* 4. Validation Status & Student Data Upload Panel */}
      <section className="gov-two-col-grid" aria-label="Status and Tasks">
        {/* Left Card: Validation Status */}
        <article className="gov-sub-panel">
          <div className="panel-heading-with-icon">
            <span className="panel-icon">📋</span>
            <h2 className="sub-panel-title">{lang === 'hi' ? 'संस्थागत सत्यापन स्थिति' : 'Institutional Validation Status'}</h2>
          </div>
          <div className="validation-status-list">
            {validationItems.map((item, idx) => (
              <div key={idx} className="val-status-row">
                <div className="val-row-left">
                  <span className="val-row-label">{item.label}</span>
                </div>
                <div className="val-row-right">
                  {item.type === 'complete' && (
                    <span className="val-badge badge-green">✓ {item.status}</span>
                  )}
                  {item.type === 'warning' && (
                    <span className="val-badge badge-warning">⚠ {item.status}</span>
                  )}
                  {item.type === 'pending' && (
                    <span className="val-badge badge-blue">⏳ {item.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Right Card: Quick Student CSV Upload Section */}
        <article className="gov-sub-panel">
          <div className="panel-heading-with-icon">
            <span className="panel-icon">📤</span>
            <h2 className="sub-panel-title">{getTranslation('uploadCardTitle', lang)}</h2>
          </div>
          <div className="quick-upload-form">
            <div className="gov-form-grid-2">
              <div className="gov-field-group">
                <label className="gov-field-label">{getTranslation('academicYear', lang)}</label>
                <select className="gov-field-input" defaultValue="2026-27">
                  <option value="2026-27">2026-27</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </div>
              <div className="gov-field-group">
                <label className="gov-field-label">{getTranslation('selectProgramme', lang)}</label>
                <select
                  className="gov-field-input"
                  value={selectedProgramme}
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                >
                  <option value="B.Tech CSE">B.Tech Computer Science (CSE)</option>
                  <option value="B.Tech ECE">B.Tech Electronics & Comm (ECE)</option>
                  <option value="B.Tech MECH">B.Tech Mechanical Engineering (MECH)</option>
                  <option value="B.Tech CIVIL">B.Tech Civil Engineering</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="dropzone-box" onClick={() => navigateTo('upload')} role="button" tabIndex={0}>
              <div className="dropzone-cloud-icon">☁️</div>
              <p className="dropzone-text">{getTranslation('dragDropCsv', lang)}</p>
              <button type="button" className="gov-btn-browse">
                {getTranslation('chooseFileBtn', lang)}
              </button>
              <span className="dropzone-hint">CSV max 10MB · 12-digit APAAR format (Identifiers Masked)</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
