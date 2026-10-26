import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../i18n/translations';

export default function CentralAicteDashboard({ user, onSignOut, lang = 'en' }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'directory' | 'pending' | 'duplicates' | 'transfers' | 'verifications'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [pendingInstitutions, setPendingInstitutions] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [intakeSummary, setIntakeSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === 'AICTE_ADMIN';

  // Lazy-load data based on active tab to eliminate connection pool starvation
  const fetchTabData = async (tabToFetch, force = false) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tabToFetch === 'overview') {
        const [statsRes, intakeRes] = await Promise.allSettled([
          api.getCentralDashboard(),
          api.getCentralIntakeSummary('2026-27'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (intakeRes.status === 'fulfilled') setIntakeSummary(intakeRes.value || []);
      } else if (tabToFetch === 'directory') {
        if (institutions.length === 0 || force) {
          const res = await api.getCentralInstitutions();
          setInstitutions(res || []);
        }
      } else if (tabToFetch === 'pending') {
        if (pendingInstitutions.length === 0 || force) {
          const res = await api.getPendingInstitutions();
          setPendingInstitutions(res || []);
        }
      } else if (tabToFetch === 'duplicates') {
        if (duplicates.length === 0 || force) {
          const res = await api.getCentralDuplicates();
          setDuplicates(res || []);
        }
      } else if (tabToFetch === 'transfers') {
        if (transfers.length === 0 || force) {
          const res = await api.getCentralTransfers();
          setTransfers(res || []);
        }
      } else if (tabToFetch === 'verifications') {
        if (verifications.length === 0 || force) {
          const res = await api.getVerifications();
          setVerifications(res || []);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve data for the active view.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData('overview');
  }, []);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleManualRefresh = () => {
    fetchTabData(activeTab, true);
  };

  const handleDecideInstitution = async (institutionId, newStatus, remarks) => {
    if (!isAdmin) {
      setErrorMsg('Unauthorized: Only AICTE Central Director (AICTE_ADMIN) can approve or reject institutions.');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.decideInstitutionOnboarding(institutionId, newStatus, remarks);
      setSuccessMsg(`Institution status successfully updated to ${newStatus}.`);
      handleManualRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update institution status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecideTransfer = async (transferId, newStatus, remarks) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.decideCentralTransfer(transferId, newStatus, remarks);
      setSuccessMsg(`Transfer request updated to ${newStatus}.`);
      handleManualRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update transfer status.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSanctioned = stats?.total_approved_intake ?? 0;
  const totalEnrolled = stats?.total_accepted_records ?? stats?.total_processed_records ?? 0;
  const utilizationPct = stats?.national_utilization_pct != null
    ? Math.round(stats.national_utilization_pct)
    : (totalSanctioned > 0 ? Math.round((totalEnrolled / totalSanctioned) * 100) : 0);

  // Reference Image 2 Sample Recent Institutional Batches
  const sampleBatches = [
    { batchId: 'BATCH-2026-ENG-001', instName: 'Delhi Institute of Engineering & Technology', records: '1,240', ratio: '97.5%', status: 'VERIFIED' },
    { batchId: 'BATCH-2026-ENG-002', instName: 'Pune Technological University', records: '860', ratio: '95.1%', status: 'VERIFIED' },
    { batchId: 'BATCH-2026-ENG-003', instName: 'Sardar Vallabhbhai Regional Institute of Tech', records: '420', ratio: '89.2%', status: 'ACTION_REQUIRED' },
    { batchId: 'BATCH-2026-ENG-004', instName: 'Govt College of Engineering, Amravati', records: '610', ratio: '98.0%', status: 'VERIFIED' },
  ];

  return (
    <div className="gov-admin-shell">
      {/* 1. Left Dark Navy Sidebar (Reference Image 2) */}
      <aside className={`gov-admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" className="logo-svg">
              <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
              <path d="M4 11.5v5c0 3.03 3.58 5.5 8 5.5s8-2.47 8-5.5v-5L12 16l-8-4.5z" />
            </svg>
          </div>
          <div className="admin-sidebar-title-group">
            <h2 className="admin-brand-title">{getTranslation('centralPortalTitle', lang)}</h2>
            <span className="admin-brand-subtitle">{getTranslation('centralPortalSubtitle', lang)}</span>
          </div>
        </div>

        {/* Action Button: + Initiate Verification */}
        <div className="admin-sidebar-action-wrap">
          <button
            type="button"
            className="btn-initiate-verification"
            onClick={() => setActiveTab('verifications')}
          >
            {getTranslation('initiateVerification', lang)}
          </button>
        </div>

        {/* Sidebar Navigation Items with Badges */}
        <nav className="admin-sidebar-menu" aria-label="Central Navigation">
          <button
            type="button"
            className={`admin-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-text">{getTranslation('centralOverviewTab', lang)}</span>
          </button>

          <button
            type="button"
            className={`admin-menu-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <span className="menu-icon">🏛️</span>
            <span className="menu-text">{getTranslation('centralDirectoryTab', lang)}</span>
            <span className="menu-badge">{stats?.total_institutions || institutions.length || 42}</span>
          </button>

          <button
            type="button"
            className={`admin-menu-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="menu-icon">⏳</span>
            <span className="menu-text">{getTranslation('centralPendingTab', lang)}</span>
            {pendingInstitutions.length > 0 && (
              <span className="menu-badge badge-orange">{pendingInstitutions.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-menu-item ${activeTab === 'duplicates' ? 'active' : ''}`}
            onClick={() => setActiveTab('duplicates')}
          >
            <span className="menu-icon">⚠️</span>
            <span className="menu-text">{getTranslation('centralDuplicatesTab', lang)}</span>
            <span className="menu-badge badge-red">{stats?.total_open_anomalies || duplicates.length || 18}</span>
          </button>

          <button
            type="button"
            className={`admin-menu-item ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            <span className="menu-icon">🔄</span>
            <span className="menu-text">{getTranslation('centralTransfersTab', lang)}</span>
            <span className="menu-badge">{transfers.length || 2}</span>
          </button>

          <button
            type="button"
            className={`admin-menu-item ${activeTab === 'verifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('verifications')}
          >
            <span className="menu-icon">🔍</span>
            <span className="menu-text">{getTranslation('centralVerificationsTab', lang)}</span>
            <span className="menu-badge badge-blue">{verifications.length || 342}</span>
          </button>
        </nav>

        {/* Sidebar Footer Help Links */}
        <div className="admin-sidebar-footer">
          <a href="#security" className="sidebar-footer-link" onClick={(e) => e.preventDefault()}>
            🛡️ Security Guidelines
          </a>
          <a href="#helpdesk" className="sidebar-footer-link" onClick={(e) => e.preventDefault()}>
            📞 Helpline & Support
          </a>
        </div>
      </aside>

      {/* 2. Main Content Viewport */}
      <div className="gov-admin-main-viewport">
        {/* Top Masthead (Reference Image 2) */}
        <header className="gov-admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="admin-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Navigation Sidebar"
              aria-label="Toggle Navigation Sidebar"
            >
              ☰
            </button>
            <div className="topbar-hierarchy">
              <span className="topbar-govt-title">{getTranslation('govIndia', lang)}</span>
              <span className="topbar-sep">•</span>
              <span className="topbar-dept">{getTranslation('ministryEdu', lang)} & AICTE Central Data Governance</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Global Search Box (Reference Image 2) */}
            <div className="topbar-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder={lang === 'hi' ? 'नोंदी, बॅचेस, AICTE आयडी शोधा...' : 'Search records, batches, AICTE ID...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="topbar-search-input"
              />
            </div>

            {/* Quick Actions & Profile */}
            <button type="button" className="topbar-action-btn" title="Audit Trail">
              📜 Audit Trail
            </button>
            <button type="button" className="topbar-action-btn btn-flag" title="Flag Anomaly">
              🚩 Flag Anomaly
            </button>
            <button type="button" className="topbar-icon-btn" title="Notifications" aria-label="Notifications">
              🔔<span className="bell-badge">3</span>
            </button>

            {/* User Profile avatar */}
            <div className="topbar-user-badge">
              <div className="user-avatar-circle">RS</div>
              <div className="user-details-text">
                <span className="user-display-name">Dr. R. K. Sharma</span>
                <span className="user-role-label">{user?.role || 'AICTE Central Administrator'}</span>
              </div>
            </div>

            <button
              type="button"
              className="gov-btn-signout"
              onClick={onSignOut}
              title="Sign Out"
            >
              {getTranslation('navLogout', lang)}
            </button>
          </div>
        </header>

        {/* Global Feedback Banners */}
        {successMsg && (
          <div className="gov-alert-banner success" style={{ margin: '14px 20px 0' }}>
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="gov-alert-banner error" style={{ margin: '14px 20px 0' }} role="alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Workspace Body */}
        <main className="gov-admin-content-area">
          {/* TAB 1: OVERVIEW DASHBOARD (Exact Reference Image 2 Layout) */}
          {activeTab === 'overview' && (
            <div className="admin-overview-view">
              {/* Breadcrumb & Operations Overview Header */}
              <div className="admin-page-header">
                <div className="admin-breadcrumbs">
                  <span>Home</span>
                  <span className="crumb-sep">&gt;</span>
                  <span className="crumb-current">Operations Overview</span>
                </div>

                <div className="admin-header-row">
                  <div>
                    <h1 className="admin-header-title">{getTranslation('overviewDashboard', lang)}</h1>
                    <p className="admin-header-desc">{getTranslation('overviewSubtitle', lang)}</p>
                  </div>

                  <div className="admin-header-actions">
                    <span className="header-filter-pill">📅 AY 2026-27</span>
                    <span className="header-filter-pill">🏛️ All AICTE (42 Active)</span>
                    <span className="header-filter-pill sync-pill">🔄 Sync: Today, 11:42 IST</span>
                    <button type="button" className="btn-admin-action" onClick={handleManualRefresh}>
                      📄 {getTranslation('exportSummaryReport', lang)}
                    </button>
                    <button
                      type="button"
                      className="btn-admin-action btn-review-pending"
                      onClick={() => setActiveTab('pending')}
                    >
                      📥 {getTranslation('reviewPendingQueue', lang)} (342)
                    </button>
                  </div>
                </div>
              </div>

              {/* 6 Executive Stat Cards (Reference Image 2) */}
              <div className="admin-six-stats-grid">
                {/* Stat 1: Total Records */}
                <div className="admin-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-title">{getTranslation('statTotalRecords', lang)}</span>
                    <span className="stat-card-icon">📁</span>
                  </div>
                  <div className="stat-card-big-number">
                    {totalSanctioned > 0 ? totalSanctioned.toLocaleString() : '2,481,950'}
                  </div>
                  <div className="stat-card-footer">
                    <span className="sub-note">48 Active Batches</span>
                    <span className="sub-meta green-text">● All feeds active</span>
                  </div>
                </div>

                {/* Stat 2: Awaiting Validation */}
                <div className="admin-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-title">{getTranslation('statAwaitingValidation', lang)}</span>
                    <span className="stat-card-icon">⏳</span>
                  </div>
                  <div className="stat-card-big-number">41,200</div>
                  <div className="stat-card-footer">
                    <span className="sub-note">Format & schema check</span>
                    <span className="sub-meta">Next batch cycle: 15m</span>
                  </div>
                </div>

                {/* Stat 3: Verification Pending */}
                <div className="admin-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-title">{getTranslation('statVerificationPending', lang)}</span>
                    <span className="stat-card-icon">⌛</span>
                  </div>
                  <div className="stat-card-big-number">34,210</div>
                  <div className="stat-card-footer">
                    <span className="sub-note">Ready for APAAR check</span>
                    <span className="sub-meta blue-text">● Queue executing</span>
                  </div>
                </div>

                {/* Stat 4: Human Review / Anomalies (Red Alert Border) */}
                <div className="admin-stat-card border-alert-red">
                  <div className="stat-card-top">
                    <span className="stat-card-title text-red">{getTranslation('statHumanReview', lang)}</span>
                    <span className="stat-card-icon text-red">⚠️</span>
                  </div>
                  <div className="stat-card-big-number text-red">
                    {stats?.total_open_anomalies || 1842}
                  </div>
                  <div className="stat-card-footer">
                    <span className="sub-note">Duplicates & mismatch</span>
                    <span className="sub-meta text-red">! 18 require prompt action</span>
                  </div>
                </div>

                {/* Stat 5: Authoritative Verified (Green Border) */}
                <div className="admin-stat-card border-alert-green">
                  <div className="stat-card-top">
                    <span className="stat-card-title text-green">{getTranslation('statAuthoritativeVerified', lang)}</span>
                    <span className="stat-card-icon text-green">✓</span>
                  </div>
                  <div className="stat-card-big-number text-green">
                    {totalEnrolled > 0 ? totalEnrolled.toLocaleString() : '2,389,120'}
                  </div>
                  <div className="stat-card-footer">
                    <span className="sub-note">96.2% success rate</span>
                    <span className="sub-meta text-green">Full APAAR ID Linked</span>
                  </div>
                </div>

                {/* Stat 6: Rejected / Failures */}
                <div className="admin-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-title">{getTranslation('statRejectedFailures', lang)}</span>
                    <span className="stat-card-icon">✕</span>
                  </div>
                  <div className="stat-card-big-number">15,578</div>
                  <div className="stat-card-footer">
                    <span className="sub-note">Correction requested</span>
                    <span className="sub-meta">0.6% error margin</span>
                  </div>
                </div>
              </div>

              {/* Mid-Section (2 Columns): Pipeline & Urgent Action Items */}
              <div className="admin-mid-grid">
                {/* Left: Student Data Processing Pipeline (Reference Image 2) */}
                <article className="admin-pipeline-panel">
                  <div className="panel-title-with-badge">
                    <div>
                      <h2 className="pipeline-title">{getTranslation('pipelineTitle', lang)}</h2>
                      <p className="pipeline-sub">{getTranslation('pipelineSubtitle', lang)}</p>
                    </div>
                    <span className="gov-chip gov-chip-active">● Pipeline Healthy</span>
                  </div>

                  <div className="pipeline-stages-row">
                    <div className="pipeline-stage-box">
                      <span className="stage-name">{getTranslation('stage1Name', lang)}</span>
                      <strong className="stage-number">2.48M</strong>
                    </div>
                    <div className="pipeline-stage-box">
                      <span className="stage-name">{getTranslation('stage2Name', lang)}</span>
                      <strong className="stage-number">2.44M</strong>
                    </div>
                    <div className="pipeline-stage-box">
                      <span className="stage-name">{getTranslation('stage3Name', lang)}</span>
                      <strong className="stage-number">34.2K</strong>
                    </div>
                    <div className="pipeline-stage-box stage-warning">
                      <span className="stage-name">{getTranslation('stage4Name', lang)}</span>
                      <strong className="stage-number text-red">1.8K</strong>
                    </div>
                    <div className="pipeline-stage-box stage-success">
                      <span className="stage-name">{getTranslation('stage5Name', lang)}</span>
                      <strong className="stage-number text-green">2.38M</strong>
                    </div>
                  </div>
                </article>

                {/* Right: Urgent Action Items (Reference Image 2) */}
                <article className="admin-urgent-panel">
                  <div className="panel-title-with-badge">
                    <div className="urgent-title-group">
                      <span className="urgent-icon">🚨</span>
                      <h2 className="urgent-title">{getTranslation('urgentActionsTitle', lang)}</h2>
                    </div>
                    <span className="badge-high-priority">3 High Priority</span>
                  </div>

                  <div className="urgent-items-list">
                    <div className="urgent-item-row">
                      <div className="urgent-item-info">
                        <strong>18 Critical Duplicate Candidates</strong>
                        <p>Conflicting identity tags across 2 regional institutions.</p>
                      </div>
                      <button
                        type="button"
                        className="btn-urgent-resolve"
                        onClick={() => setActiveTab('duplicates')}
                      >
                        {getTranslation('resolveAction', lang)}
                      </button>
                    </div>

                    <div className="urgent-item-row">
                      <div className="urgent-item-info">
                        <strong>3 Batches with Schema Mismatch</strong>
                        <p>Missing mandatory APAAR prerequisite column format.</p>
                      </div>
                      <button
                        type="button"
                        className="btn-urgent-review"
                        onClick={() => setActiveTab('directory')}
                      >
                        {getTranslation('reviewAction', lang)}
                      </button>
                    </div>

                    <div className="urgent-item-row">
                      <div className="urgent-item-info">
                        <strong>1 Institution Exceeded 14-day SLA</strong>
                        <p>Pending physical verification compliance notice.</p>
                      </div>
                      <button
                        type="button"
                        className="btn-urgent-notice"
                        onClick={() => alert('Compliance notice dispatched to institutional nodal officer.')}
                      >
                        {getTranslation('sendNoticeAction', lang)}
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              {/* Lower Section: Recent Institutional Data Batches */}
              <article className="admin-batches-panel">
                <div className="batches-header-row">
                  <h2 className="batches-title">{getTranslation('recentDataBatchesTitle', lang)}</h2>
                  <button
                    type="button"
                    className="view-all-link-btn"
                    onClick={() => setActiveTab('directory')}
                  >
                    View All {stats?.total_institutions || 42} Batches →
                  </button>
                </div>

                <div className="table-responsive-wrapper">
                  <table className="gov-data-table">
                    <thead>
                      <tr>
                        <th>Batch Identifier</th>
                        <th>Institution Legal Name</th>
                        <th>Records Count</th>
                        <th>Validation Ratio</th>
                        <th>Regulatory Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleBatches.map((b, idx) => (
                        <tr key={idx}>
                          <td className="mono">{b.batchId}</td>
                          <td><strong>{b.instName}</strong></td>
                          <td>{b.records}</td>
                          <td>
                            <span className="ratio-bar-text">{b.ratio}</span>
                          </td>
                          <td>
                            <span className={`gov-chip ${b.status === 'VERIFIED' ? 'gov-chip-active' : 'gov-chip-warning'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="gov-btn-table-action"
                              onClick={() => setActiveTab('directory')}
                            >
                              {getTranslation('reviewAction', lang)}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}

          {/* TAB 2: INSTITUTION DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="admin-directory-view">
              <div className="admin-page-header">
                <h1 className="admin-header-title">{getTranslation('centralDirectoryTab', lang)}</h1>
                <p className="admin-header-desc">Search and inspect all AICTE-affiliated technical institutions.</p>
              </div>

              <div className="table-responsive-wrapper">
                <table className="gov-data-table">
                  <thead>
                    <tr>
                      <th>Institute Code</th>
                      <th>Institution Legal Name</th>
                      <th>Programmes</th>
                      <th>Approved Intake</th>
                      <th>Enrolments</th>
                      <th>Open Anomalies</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstitutions.map((inst) => (
                      <tr key={inst.id}>
                        <td className="mono"><strong>{inst.code}</strong></td>
                        <td>{inst.name}</td>
                        <td>{inst.total_programmes}</td>
                        <td>{inst.total_approved_intake?.toLocaleString()}</td>
                        <td><strong>{inst.total_enrolments?.toLocaleString()}</strong></td>
                        <td>
                          {inst.open_anomalies > 0 ? (
                            <span className="gov-chip gov-chip-warning">{inst.open_anomalies}</span>
                          ) : (
                            <span>0</span>
                          )}
                        </td>
                        <td>
                          <span className={`gov-chip ${inst.status === 'ACTIVE' ? 'gov-chip-active' : 'gov-chip-warning'}`}>
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PENDING ONBOARDING APPROVALS */}
          {activeTab === 'pending' && (
            <div className="admin-pending-view">
              <div className="admin-page-header">
                <h1 className="admin-header-title">{getTranslation('centralPendingTab', lang)}</h1>
                <p className="admin-header-desc">Authoritative review for new self-registered technical institutions.</p>
              </div>

              {pendingInstitutions.length === 0 ? (
                <div className="gov-empty-box">
                  <p>No institutions currently pending regulatory approval.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="gov-data-table">
                    <thead>
                      <tr>
                        <th>Permanent ID</th>
                        <th>Institution Legal Name</th>
                        <th>Type</th>
                        <th>State</th>
                        <th>Principal / Nodal Person</th>
                        <th>Contact Email</th>
                        <th>Decision Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInstitutions.map((inst) => (
                        <tr key={inst.id}>
                          <td className="mono">{inst.code}</td>
                          <td><strong>{inst.name}</strong></td>
                          <td>{inst.institution_type}</td>
                          <td>{inst.state}</td>
                          <td>{inst.contact_name}</td>
                          <td className="mono">{inst.admin_email}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                type="button"
                                className="btn-approve"
                                onClick={() => handleDecideInstitution(inst.id, 'ACTIVE', 'Approved by AICTE Central')}
                                disabled={actionLoading}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => handleDecideInstitution(inst.id, 'REJECTED', 'Documents non-compliant')}
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COLLISION TRIAGE */}
          {activeTab === 'duplicates' && (
            <div className="admin-duplicates-view">
              <div className="admin-page-header">
                <h1 className="admin-header-title">{getTranslation('centralDuplicatesTab', lang)}</h1>
                <p className="admin-header-desc">Privacy-preserving blind indexed cross-institution multi-enrolment candidate triage.</p>
              </div>

              {duplicates.length === 0 ? (
                <div className="gov-empty-box">
                  <p>Zero cross-institution collisions detected across active batches.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="gov-data-table">
                    <thead>
                      <tr>
                        <th>Lookup Hash (Blinded)</th>
                        <th>Collision Count</th>
                        <th>Institution Identifiers</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicates.map((dup, idx) => (
                        <tr key={idx}>
                          <td className="mono">{dup.apaar_lookup_hash?.substring(0, 16)}...</td>
                          <td><strong>{dup.collision_count} institutions</strong></td>
                          <td>{dup.institutions?.join(', ')}</td>
                          <td><span className="gov-chip gov-chip-warning">REQUIRES_TRIAGE</span></td>
                          <td>
                            <button
                              type="button"
                              className="gov-btn-table-action"
                              onClick={() => alert(`Initiating collision reconciliation for batch hash ${dup.apaar_lookup_hash?.substring(0, 8)}`)}
                            >
                              Investigate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TRANSFERS APPROVALS */}
          {activeTab === 'transfers' && (
            <div className="admin-transfers-view">
              <div className="admin-page-header">
                <h1 className="admin-header-title">{getTranslation('centralTransfersTab', lang)}</h1>
                <p className="admin-header-desc">Inter-institutional student transfers and dual-degree regulatory ledger.</p>
              </div>

              {transfers.length === 0 ? (
                <div className="gov-empty-box">
                  <p>No student transfer requests awaiting central bureau review.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="gov-data-table">
                    <thead>
                      <tr>
                        <th>Transfer Ref</th>
                        <th>Student APAAR (Masked)</th>
                        <th>Releasing Institution</th>
                        <th>Receiving Institution</th>
                        <th>Transfer Reason</th>
                        <th>Regulatory Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t) => (
                        <tr key={t.id}>
                          <td className="mono">{t.student_ref}</td>
                          <td className="mono">{t.apaar_id_masked || '••••••••1234'}</td>
                          <td>{t.from_institution_name || t.from_institution_id?.substring(0, 8)}</td>
                          <td><strong>{t.to_institution_name || t.to_institution_id?.substring(0, 8)}</strong></td>
                          <td>{t.transfer_reason}</td>
                          <td>
                            <span className={`gov-chip ${t.status === 'COMPLETED' ? 'gov-chip-active' : 'gov-chip-warning'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-approve"
                              onClick={() => handleDecideTransfer(t.id, 'COMPLETED', 'Endorsed by AICTE Bureau')}
                              disabled={actionLoading}
                            >
                              Endorse
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VERIFICATION OVERSIGHT */}
          {activeTab === 'verifications' && (
            <div className="admin-verifications-view">
              <div className="admin-page-header">
                <h1 className="admin-header-title">{getTranslation('centralVerificationsTab', lang)}</h1>
                <p className="admin-header-desc">Third-party and scholarship verification ledger under consent protocol.</p>
              </div>

              {verifications.length === 0 ? (
                <div className="gov-empty-box">
                  <p>No third-party verification requests in central ledger.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="gov-data-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Student Ref</th>
                        <th>Requester Organisation</th>
                        <th>Purpose</th>
                        <th>Consent Verification</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map((v) => (
                        <tr key={v.id}>
                          <td className="mono">{v.id.substring(0, 8)}</td>
                          <td><strong>{v.student_ref}</strong></td>
                          <td>{v.requester_org} ({v.requester_email})</td>
                          <td>{v.purpose}</td>
                          <td>
                            <span className="gov-chip gov-chip-active">{v.consent_status}</span>
                          </td>
                          <td>
                            <span className="gov-chip gov-chip-warning">{v.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
