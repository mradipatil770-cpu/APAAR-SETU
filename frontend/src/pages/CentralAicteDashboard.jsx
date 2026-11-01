import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../i18n/translations';

export default function CentralAicteDashboard({ user, onSignOut, lang = 'en' }) {
  // Navigation: 11 distinct administrative modules
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'directory' | 'pending' | 'students' | 'intake' | 'duplicates' | 'transfers' | 'verifications' | 'reports' | 'audit' | 'settings'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Core administrative dataset from real database
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [pendingInstitutions, setPendingInstitutions] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [intakeSummary, setIntakeSummary] = useState([]);
  const [studentsData, setStudentsData] = useState({ total: 0, items: [] });
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & user interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState('ALL');
  const [selectedInstDetail, setSelectedInstDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [reportType, setReportType] = useState('intake');

  // Decision & action state
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [activeModal, setActiveModal] = useState(null); // { type: 'onboarding'|'transfer'|'verification', item: object }
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isAdmin = user?.role === 'AICTE_ADMIN';

  // Fetch data per tab on demand to prevent connection starvation
  const fetchTabData = async (tabToFetch, force = false) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tabToFetch === 'overview') {
        const [statsRes, pendingRes, dupsRes, transRes, verifRes] = await Promise.allSettled([
          api.getCentralDashboard(),
          api.getPendingInstitutions(),
          api.getCentralDuplicates(),
          api.getCentralTransfers(),
          api.getVerifications(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (pendingRes.status === 'fulfilled') setPendingInstitutions(pendingRes.value || []);
        if (dupsRes.status === 'fulfilled') setDuplicates(dupsRes.value || []);
        if (transRes.status === 'fulfilled') setTransfers(transRes.value || []);
        if (verifRes.status === 'fulfilled') setVerifications(verifRes.value || []);
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
      } else if (tabToFetch === 'students') {
        const res = await api.getCentralStudents(searchTerm, 50, 0);
        setStudentsData(res || { total: 0, items: [] });
      } else if (tabToFetch === 'intake') {
        if (intakeSummary.length === 0 || force) {
          const res = await api.getCentralIntakeSummary(selectedYear);
          setIntakeSummary(res || []);
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
      } else if (tabToFetch === 'audit') {
        const res = await api.getCentralAuditLogs(50);
        setAuditLogs(res || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve records from the administrative database.');
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

  // Inspect detailed institutional profile
  const handleViewInstitutionDetail = async (instId) => {
    try {
      setLoadingDetail(true);
      setErrorMsg(null);
      const detail = await api.getCentralInstitutionDetail(instId);
      setSelectedInstDetail(detail);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve institution details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Adjudicate Institution Onboarding
  const handleDecideInstitution = async (institutionId, newStatus) => {
    if (!isAdmin) {
      setErrorMsg('Unauthorized: Only AICTE Central Director (AICTE_ADMIN) can approve or reject onboarding.');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.decideInstitutionOnboarding(institutionId, newStatus, decisionRemarks);
      setSuccessMsg(`Institution request successfully updated to ${newStatus}.`);
      setActiveModal(null);
      setDecisionRemarks('');
      handleManualRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update institution onboarding decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Adjudicate Student Transfer
  const handleDecideTransfer = async (transferId, newStatus) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.decideCentralTransfer(transferId, newStatus, decisionRemarks);
      setSuccessMsg(`Transfer request decided as ${newStatus}.`);
      setActiveModal(null);
      setDecisionRemarks('');
      handleManualRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update transfer status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV Report
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'intake') {
      csvContent += 'Programme Code,Programme Name,Academic Year,Approved Intake,Enrolled Count,Utilization %\n';
      intakeSummary.forEach((r) => {
        csvContent += `"${r.programme_code}","${r.programme_name}","${r.academic_year}",${r.total_approved_intake},${r.total_enrolled},${r.utilization_pct}%\n`;
      });
    } else if (reportType === 'directory') {
      csvContent += 'Institution Code,Legal Name,Programmes,Approved Seats,Admitted Students,Utilization %\n';
      institutions.forEach((i) => {
        csvContent += `"${i.code}","${i.name}",${i.programme_count},${i.approved_intake},${i.enrolled_count},${i.utilization_pct}%\n`;
      });
    } else {
      csvContent += 'Masked APAAR,Collision Count,Institutions,Academic Years\n';
      duplicates.forEach((d) => {
        csvContent += `"${d.masked_apaar}",${d.student_count},"${d.institutions.join(';')}","${d.academic_years.join(';')}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Central_${reportType.toUpperCase()}_Report_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derived baseline values (zero if empty, never fake)
  const totalEnrolled = stats?.total_accepted_records ?? stats?.total_processed_records ?? 0;
  const totalRegisteredInst = stats?.total_institutions || institutions.length || 0;
  const pendingActionsCount = pendingInstitutions.length + duplicates.length + transfers.filter((t) => t.status === 'PENDING').length;
  const totalVerificationsCount = verifications.length;

  // Filtered directory items
  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch =
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Navigation menu items definition
  const navMenuItems = [
    { key: 'overview', label: lang === 'hi' ? 'डॅशबोर्ड' : 'Dashboard', icon: '📊' },
    { key: 'directory', label: lang === 'hi' ? 'संस्था निर्देशिका' : 'Institution Directory', icon: '🏛️', count: totalRegisteredInst },
    { key: 'pending', label: lang === 'hi' ? 'संस्था नोंदणी पुनरावलोकन' : 'Institution Onboarding', icon: '⏳', count: pendingInstitutions.length, alert: pendingInstitutions.length > 0 },
    { key: 'students', label: lang === 'hi' ? 'विद्यार्थी नोंदी' : 'Student Records', icon: '🎓', count: totalEnrolled },
    { key: 'intake', label: lang === 'hi' ? 'प्रवेश क्षमता निरीक्षण' : 'Intake Monitoring', icon: '📈' },
    { key: 'duplicates', label: lang === 'hi' ? 'डुप्लिकेट पुनरावलोकन' : 'Duplicate Review', icon: '⚠️', count: duplicates.length, alert: duplicates.length > 0 },
    { key: 'transfers', label: lang === 'hi' ? 'हस्तांतरण विनंत्या' : 'Transfer Requests', icon: '🔄', count: transfers.length },
    { key: 'verifications', label: lang === 'hi' ? 'सत्यापन व्यवस्थापन' : 'Verification Management', icon: '🔍', count: totalVerificationsCount },
    { key: 'reports', label: lang === 'hi' ? 'अनुपालन अहवाल' : 'Reports & Exports', icon: '📑' },
    { key: 'audit', label: lang === 'hi' ? 'ऑडिट ट्रेल' : 'Audit Logs', icon: '📜' },
    { key: 'settings', label: lang === 'hi' ? 'प्रणाली सेटिंग्ज' : 'Settings', icon: '⚙️' },
  ];

  const getBreadcrumbTitle = () => {
    const item = navMenuItems.find((m) => m.key === activeTab);
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="gov-central-admin-portal">
      {/* 1. Left Fixed Navy Sidebar Navigation (Reference Image 2 Theme) */}
      <aside className={`gov-admin-navy-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-top-branding">
          <div className="sidebar-brand-left">
            <div className="sidebar-mortarboard-crest" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" className="crest-svg">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z" />
              </svg>
            </div>
            {sidebarOpen && (
              <div className="sidebar-brand-text">
                <span className="brand-name">APAARSetu</span>
                <span className="brand-sub">Central Admin</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label="Toggle navigation sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="sidebar-nav-menu" aria-label="Central Administrative Navigation">
          {navMenuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.key);
                setSelectedInstDetail(null);
              }}
              title={item.label}
            >
              <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
              {sidebarOpen && <span className="nav-item-label">{item.label}</span>}
              {sidebarOpen && item.count !== undefined && item.count > 0 && (
                <span className={`nav-item-badge ${item.alert ? 'badge-alert' : ''}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer info */}
        {sidebarOpen && (
          <div className="sidebar-bottom-info">
            <span className="system-session-tag">AY 2026-27 Active</span>
            <span className="system-secure-tag">Authorized Central Session</span>
          </div>
        )}
      </aside>

      {/* 2. Main Content Workspace Area */}
      <main className="gov-admin-workspace">
        {/* Workspace Breadcrumb & Header Bar */}
        <div className="workspace-page-header">
          <div className="workspace-header-left">
            <div className="workspace-breadcrumb">
              <span>Home</span>
              <span className="crumb-sep">&gt;</span>
              <span>Central Administration</span>
              <span className="crumb-sep">&gt;</span>
              <strong className="crumb-active">{getBreadcrumbTitle()}</strong>
            </div>
            <h1 className="workspace-heading">
              {activeTab === 'overview'
                ? 'Central Administration Dashboard'
                : getBreadcrumbTitle()}
            </h1>
            <p className="workspace-subtitle">
              {activeTab === 'overview'
                ? 'Monitor institutional student-data submissions, review discrepancies and manage authorised verification activities.'
                : `Official AICTE central management view for ${getBreadcrumbTitle().toLowerCase()}.`}
            </p>
          </div>

          <div className="workspace-header-actions">
            <button
              type="button"
              className="gov-action-btn-secondary"
              onClick={handleManualRefresh}
              title="Refresh database records"
            >
              <span aria-hidden="true">🔄</span>
              <span>{lang === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Alert Feedback Messages */}
        {successMsg && (
          <div className="gov-message-banner success">
            <span>✓ {successMsg}</span>
            <button type="button" className="btn-close-msg" onClick={() => setSuccessMsg(null)}>✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="gov-message-banner error" role="alert">
            <span>⚠️ {errorMsg}</span>
            <button type="button" className="btn-close-msg" onClick={() => setErrorMsg(null)}>✕</button>
          </div>
        )}

        {/* Workspace Body Content */}
        <div className="workspace-body-container">
          {/* =========================================================================
              MODULE 1: CENTRAL OVERVIEW DASHBOARD
              ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="admin-overview-module">
              {/* 4 Simple White Statistic Cards (Thin grey borders, No colourful boxes) */}
              <section className="admin-four-stat-cards" aria-label="Key Central Metrics">
                {/* Stat 1: Registered Institutions */}
                <article
                  className="admin-stat-card"
                  onClick={() => setActiveTab('directory')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-card-title">{lang === 'hi' ? 'नोंदणीकृत संस्था' : 'Registered Institutions'}</div>
                  <div className="stat-card-number">{totalRegisteredInst.toLocaleString()}</div>
                  <div className="stat-card-sub">Approved AICTE Technical Institutions</div>
                </article>

                {/* Stat 2: Student Records */}
                <article
                  className="admin-stat-card"
                  onClick={() => setActiveTab('students')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-card-title">{lang === 'hi' ? 'विद्यार्थी नोंदी' : 'Student Records'}</div>
                  <div className="stat-card-number">{totalEnrolled.toLocaleString()}</div>
                  <div className="stat-card-sub">Admitted Student Enrolments</div>
                </article>

                {/* Stat 3: Pending Reviews */}
                <article
                  className="admin-stat-card"
                  onClick={() => setActiveTab('pending')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-card-title">{lang === 'hi' ? 'प्रलंबित पुनरावलोकन' : 'Pending Reviews'}</div>
                  <div className="stat-card-number text-orange">{pendingActionsCount.toLocaleString()}</div>
                  <div className="stat-card-sub">Onboarding & Collision Triage Items</div>
                </article>

                {/* Stat 4: Verification Requests */}
                <article
                  className="admin-stat-card"
                  onClick={() => setActiveTab('verifications')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-card-title">{lang === 'hi' ? 'सत्यापन विनंत्या' : 'Verification Requests'}</div>
                  <div className="stat-card-number">{totalVerificationsCount.toLocaleString()}</div>
                  <div className="stat-card-sub">Authorised Central Verification Ledger</div>
                </article>
              </section>

              {/* Section A: Pending Administrative Actions */}
              <section className="admin-content-section" aria-label="Pending Administrative Actions">
                <div className="section-title-bar">
                  <h2 className="section-main-title">
                    {lang === 'hi' ? 'प्रलंबित प्रशासकीय कृती' : 'Pending Administrative Actions'}
                  </h2>
                  <span className="section-record-count">({pendingActionsCount} items requiring action)</span>
                </div>

                {pendingActionsCount > 0 ? (
                  <div className="table-responsive-box">
                    <table className="gov-clean-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Identifier / Subject</th>
                          <th>Details</th>
                          <th>Current Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Pending Institutions */}
                        {pendingInstitutions.map((p) => (
                          <tr key={`p-${p.id}`}>
                            <td><span className="table-tag tag-blue">Onboarding</span></td>
                            <td><strong>{p.name}</strong> ({p.code})</td>
                            <td>Official Email: {p.email}</td>
                            <td><span className="status-badge status-warning">Awaiting Central Approval</span></td>
                            <td>
                              <button
                                type="button"
                                className="btn-link-action"
                                onClick={() => setActiveTab('pending')}
                              >
                                Review Request →
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Duplicate Collision Candidates */}
                        {duplicates.map((d, idx) => (
                          <tr key={`dup-${idx}`}>
                            <td><span className="table-tag tag-amber">Collision Candidate</span></td>
                            <td className="mono">{d.masked_apaar}</td>
                            <td>Matches detected across {d.institutions?.length || 2} institutions ({d.institutions?.join(', ')})</td>
                            <td><span className="status-badge status-warning">Triage Required</span></td>
                            <td>
                              <button
                                type="button"
                                className="btn-link-action"
                                onClick={() => setActiveTab('duplicates')}
                              >
                                Review Collision →
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Pending Transfers */}
                        {transfers.filter((t) => t.status === 'PENDING').map((t) => (
                          <tr key={`trans-${t.id}`}>
                            <td><span className="table-tag tag-teal">Student Migration</span></td>
                            <td>Ref: {t.student_ref} ({t.apaar_id_masked || 'APAAR Masked'})</td>
                            <td>Migration to {t.to_institution_name || 'Destination Institution'}</td>
                            <td><span className="status-badge status-warning">Pending NOC</span></td>
                            <td>
                              <button
                                type="button"
                                className="btn-link-action"
                                onClick={() => setActiveTab('transfers')}
                              >
                                Review NOC →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="gov-empty-notice">
                    <span className="empty-icon" aria-hidden="true">✓</span>
                    <p className="empty-text">No pending administrative actions requiring review.</p>
                  </div>
                )}
              </section>

              {/* Section B: Recent Institutional Activity */}
              <section className="admin-content-section" aria-label="Recent Institutional Activity">
                <div className="section-title-bar">
                  <h2 className="section-main-title">
                    {lang === 'hi' ? 'अलीकडील संस्थात्मक क्रियाकलाप' : 'Recent Institutional Activity'}
                  </h2>
                </div>

                {institutions.length > 0 ? (
                  <div className="table-responsive-box">
                    <table className="gov-clean-table">
                      <thead>
                        <tr>
                          <th>Institution</th>
                          <th>Activity</th>
                          <th>Academic Session</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {institutions.slice(0, 5).map((inst) => (
                          <tr key={inst.id}>
                            <td>
                              <strong>{inst.name}</strong>
                              <div className="table-cell-sub mono">{inst.code}</div>
                            </td>
                            <td>{inst.enrolled_count > 0 ? `${inst.enrolled_count} Student Records Submissions` : 'Institutional Profile Verified'}</td>
                            <td>AY 2026-27</td>
                            <td>
                              <span className="status-badge status-success">Verified & Active</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-link-action"
                                onClick={() => {
                                  setActiveTab('directory');
                                  handleViewInstitutionDetail(inst.id);
                                }}
                              >
                                View Details →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="gov-empty-notice">
                    <p className="empty-text">No recent institutional activity available.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================================================================
              MODULE 2: INSTITUTION DIRECTORY
              ========================================================================= */}
          {activeTab === 'directory' && (
            <div className="admin-directory-module">
              {/* Search & Filter Bar */}
              <div className="table-filter-bar">
                <div className="search-input-group">
                  <span className="search-icon" aria-hidden="true">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by Institution Name or AICTE Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="gov-search-input"
                  />
                </div>
                <div className="filter-summary-info">
                  Showing {filteredInstitutions.length} Institutions
                </div>
              </div>

              {filteredInstitutions.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>AICTE Code</th>
                        <th>Institution Legal Name</th>
                        <th>Programmes</th>
                        <th>Approved Intake</th>
                        <th>Admitted Enrolments</th>
                        <th>Capacity Utilization</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstitutions.map((inst) => (
                        <tr key={inst.id}>
                          <td className="mono font-semibold">{inst.code}</td>
                          <td><strong>{inst.name}</strong></td>
                          <td>{inst.programme_count} Programmes</td>
                          <td>{inst.approved_intake.toLocaleString()}</td>
                          <td>{inst.enrolled_count.toLocaleString()}</td>
                          <td>
                            <span className="utilization-rate">
                              {inst.utilization_pct}%
                            </span>
                          </td>
                          <td>
                            <span className="status-badge status-success">Approved</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="gov-btn-table-sm"
                              onClick={() => handleViewInstitutionDetail(inst.id)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <p className="empty-text">No institutions found matching the search criteria.</p>
                </div>
              )}

              {/* Institution Detail Modal / Drawer */}
              {selectedInstDetail && (
                <div className="gov-modal-backdrop" onClick={() => setSelectedInstDetail(null)}>
                  <div className="gov-modal-card" onClick={(e) => e.stopPropagation()}>
                    <div className="gov-modal-header">
                      <div>
                        <h3 className="modal-title">{selectedInstDetail.name}</h3>
                        <span className="modal-sub mono">AICTE Code: {selectedInstDetail.code}</span>
                      </div>
                      <button type="button" className="modal-close-btn" onClick={() => setSelectedInstDetail(null)}>✕</button>
                    </div>
                    <div className="gov-modal-body">
                      <h4 className="modal-section-title">Approved Programmes & Intake Allocation</h4>
                      {selectedInstDetail.programmes?.length > 0 ? (
                        <table className="gov-clean-table sm">
                          <thead>
                            <tr>
                              <th>Programme</th>
                              <th>Academic Year</th>
                              <th>Approved Intake</th>
                              <th>Admitted Students</th>
                              <th>Compliance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInstDetail.programmes.map((p, idx) => (
                              <tr key={idx}>
                                <td>{p.programme_name} ({p.programme_code})</td>
                                <td>{p.academic_year}</td>
                                <td>{p.approved_intake}</td>
                                <td>{p.enrolled_count}</td>
                                <td>
                                  <span className={`status-badge ${p.is_exceeded ? 'status-danger' : 'status-success'}`}>
                                    {p.is_exceeded ? 'Intake Exceeded' : 'Compliant'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="empty-text">No programme records configured for this institution.</p>
                      )}
                    </div>
                    <div className="gov-modal-footer">
                      <button type="button" className="gov-action-btn-secondary" onClick={() => setSelectedInstDetail(null)}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 3: INSTITUTION ONBOARDING (Approval / Rejection Workflow)
              ========================================================================= */}
          {activeTab === 'pending' && (
            <div className="admin-pending-module">
              <div className="module-intro-box">
                <p>Review self-registration requests from new technical institutions awaiting AICTE central authorization.</p>
              </div>

              {pendingInstitutions.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Institution Legal Name</th>
                        <th>AICTE Code</th>
                        <th>Official Email</th>
                        <th>Regulatory Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInstitutions.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td className="mono">{p.code}</td>
                          <td>{p.email}</td>
                          <td>
                            <span className="status-badge status-warning">Pending Onboarding</span>
                          </td>
                          <td>
                            <div className="table-action-btns">
                              <button
                                type="button"
                                className="btn-approve-sm"
                                onClick={() => {
                                  setActiveModal({ type: 'onboarding', item: p, decision: 'APPROVED' });
                                }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-reject-sm"
                                onClick={() => {
                                  setActiveModal({ type: 'onboarding', item: p, decision: 'REJECTED' });
                                }}
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
              ) : (
                <div className="gov-empty-notice">
                  <span className="empty-icon" aria-hidden="true">✓</span>
                  <p className="empty-text">No pending institution onboarding requests awaiting review.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 4: STUDENT RECORDS DIRECTORY (Masked APAAR, Paginated)
              ========================================================================= */}
          {activeTab === 'students' && (
            <div className="admin-students-module">
              <div className="table-filter-bar">
                <div className="search-input-group">
                  <span className="search-icon" aria-hidden="true">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by student reference, masked APAAR, or institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTabData('students')}
                    className="gov-search-input"
                  />
                </div>
                <button
                  type="button"
                  className="gov-action-btn-secondary"
                  onClick={() => fetchTabData('students')}
                >
                  Search
                </button>
              </div>

              {studentsData.items?.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Student Reference</th>
                        <th>Masked APAAR ID</th>
                        <th>Institution Legal Name</th>
                        <th>Programme</th>
                        <th>Academic Session</th>
                        <th>Regulatory Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsData.items.map((st) => (
                        <tr key={st.id}>
                          <td className="font-semibold">{st.student_ref}</td>
                          <td className="mono">{st.apaar_id_masked}</td>
                          <td>{st.institution_name}</td>
                          <td>{st.programme_name}</td>
                          <td>{st.academic_year}</td>
                          <td>
                            <span className="status-badge status-success">Validated Record</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <span className="empty-icon" aria-hidden="true">🎓</span>
                  <p className="empty-text">No student records submitted yet across institutions.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 5: INTAKE MONITORING
              ========================================================================= */}
          {activeTab === 'intake' && (
            <div className="admin-intake-module">
              <div className="table-filter-bar">
                <div className="filter-group">
                  <label htmlFor="intake-year-select" className="filter-label">Academic Year:</label>
                  <select
                    id="intake-year-select"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      api.getCentralIntakeSummary(e.target.value).then(setIntakeSummary);
                    }}
                    className="gov-select-input"
                  >
                    <option value="2026-27">Academic Year 2026 - 27</option>
                    <option value="2025-26">Academic Year 2025 - 26</option>
                  </select>
                </div>
              </div>

              {intakeSummary.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Programme Code</th>
                        <th>Technical Discipline / Programme</th>
                        <th>Approved Intake Quota</th>
                        <th>Total Admitted Enrolments</th>
                        <th>Quota Utilization</th>
                        <th>Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intakeSummary.map((item, idx) => (
                        <tr key={idx}>
                          <td className="mono font-semibold">{item.programme_code}</td>
                          <td><strong>{item.programme_name}</strong></td>
                          <td>{item.total_approved_intake?.toLocaleString() || 0} seats</td>
                          <td>{item.total_enrolled?.toLocaleString() || 0} students</td>
                          <td>
                            <span className="utilization-rate">{item.utilization_pct}%</span>
                          </td>
                          <td>
                            <span className={`status-badge ${item.total_enrolled > item.total_approved_intake ? 'status-danger' : 'status-success'}`}>
                              {item.total_enrolled > item.total_approved_intake ? 'Quota Exceeded' : 'Intake Compliant'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <p className="empty-text">No intake configuration records found for Academic Year {selectedYear}.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 6: DUPLICATE REVIEW (Collision Triage Queue)
              ========================================================================= */}
          {activeTab === 'duplicates' && (
            <div className="admin-duplicates-module">
              <div className="module-intro-box">
                <p>
                  <strong>Regulatory Advisory:</strong> Multi-enrolment collisions indicate potential cross-institutional enrolment overlap. Authorised officers must review evidence before deciding status. Matches are not automatically deemed non-compliant.
                </p>
              </div>

              {duplicates.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Masked Identifier</th>
                        <th>Collision Count</th>
                        <th>Colliding Institution Codes</th>
                        <th>Academic Years</th>
                        <th>Collision Risk Assessment</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicates.map((cand, idx) => (
                        <tr key={idx}>
                          <td className="mono font-semibold">{cand.masked_apaar}</td>
                          <td>{cand.student_count} Enrolment Instances</td>
                          <td>{cand.institutions?.join(', ')}</td>
                          <td>{cand.academic_years?.join(', ')}</td>
                          <td>
                            <span className="status-badge status-warning">Concurrent Enrolment Candidate</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="gov-btn-table-sm"
                              onClick={() => alert(`Reviewing candidate ${cand.masked_apaar}. Verification notice generated.`)}
                            >
                              Review Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <span className="empty-icon" aria-hidden="true">✓</span>
                  <p className="empty-text">No cross-institutional multi-enrolment collisions detected in the system.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 7: TRANSFER REQUESTS
              ========================================================================= */}
          {activeTab === 'transfers' && (
            <div className="admin-transfers-module">
              {transfers.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Student Reference</th>
                        <th>Masked APAAR</th>
                        <th>Originating Institution</th>
                        <th>Destination Institution</th>
                        <th>Transfer Reason</th>
                        <th>Regulatory Status</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t) => (
                        <tr key={t.id}>
                          <td className="font-semibold">{t.student_ref}</td>
                          <td className="mono">{t.apaar_id_masked || 'XXXXXXXX0000'}</td>
                          <td>{t.from_institution_name || 'Origin Institution'}</td>
                          <td>{t.to_institution_name || 'Destination Institution'}</td>
                          <td>{t.transfer_reason || 'Academic migration'}</td>
                          <td>
                            <span className={`status-badge ${t.status === 'APPROVED' ? 'status-success' : t.status === 'REJECTED' ? 'status-danger' : 'status-warning'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            {t.status === 'PENDING' ? (
                              <div className="table-action-btns">
                                <button
                                  type="button"
                                  className="btn-approve-sm"
                                  onClick={() => setActiveModal({ type: 'transfer', item: t, decision: 'APPROVED' })}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-reject-sm"
                                  onClick={() => setActiveModal({ type: 'transfer', item: t, decision: 'REJECTED' })}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="table-cell-sub">Decided</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <span className="empty-icon" aria-hidden="true">🔄</span>
                  <p className="empty-text">No student transfer requests currently recorded in the national ledger.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 8: VERIFICATION MANAGEMENT
              ========================================================================= */}
          {activeTab === 'verifications' && (
            <div className="admin-verifications-module">
              {verifications.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Verification ID</th>
                        <th>Requesting Authority</th>
                        <th>Candidate Reference</th>
                        <th>Masked APAAR</th>
                        <th>Purpose</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map((v) => (
                        <tr key={v.id}>
                          <td className="mono font-semibold">{v.id.substring(0, 8)}</td>
                          <td>{v.verifier_name}</td>
                          <td>{v.student_ref}</td>
                          <td className="mono">{v.apaar_id_masked || 'XXXXXXXX0000'}</td>
                          <td>{v.purpose || 'Official Verification'}</td>
                          <td>
                            <span className={`status-badge ${v.verification_status === 'VERIFIED' ? 'status-success' : 'status-warning'}`}>
                              {v.verification_status}
                            </span>
                          </td>
                          <td>
                            {v.verification_status === 'SUBMITTED' ? (
                              <button
                                type="button"
                                className="gov-btn-table-sm"
                                onClick={() => api.decideVerification(v.id, 'VERIFIED').then(handleManualRefresh)}
                              >
                                Authorize
                              </button>
                            ) : (
                              <span className="table-cell-sub">Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <span className="empty-icon" aria-hidden="true">🔍</span>
                  <p className="empty-text">No verification requests currently logged in the central verification queue.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 9: REPORTS & EXPORTS
              ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="admin-reports-module">
              <div className="reports-selection-card">
                <h3 className="section-main-title">Generate Regulatory Compliance Report</h3>
                <p className="section-sub-desc">Export verified institutional audit reports for governance review.</p>

                <div className="gov-form-grid-3">
                  <div className="gov-field-group">
                    <label className="gov-field-label">Report Category</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="gov-select-input"
                    >
                      <option value="intake">National Intake Compliance Summary</option>
                      <option value="directory">Approved Technical Institutions Directory</option>
                      <option value="duplicates">Multi-Enrolment Collision Summary</option>
                    </select>
                  </div>

                  <div className="gov-field-group">
                    <label className="gov-field-label">Academic Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="gov-select-input"
                    >
                      <option value="2026-27">AY 2026-27</option>
                      <option value="2025-26">AY 2025-26</option>
                    </select>
                  </div>

                  <div className="gov-field-group export-btn-col">
                    <button
                      type="button"
                      className="gov-primary-orange-btn"
                      onClick={handleExportCsv}
                    >
                      <span>📥 Export CSV Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 10: AUDIT LOGS
              ========================================================================= */}
          {activeTab === 'audit' && (
            <div className="admin-audit-module">
              {auditLogs.length > 0 ? (
                <div className="table-responsive-box">
                  <table className="gov-clean-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Actor Role</th>
                        <th>Regulatory Action</th>
                        <th>Target ID</th>
                        <th>Details</th>
                        <th>Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="table-cell-sub">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</td>
                          <td><span className="table-tag tag-blue">{log.actor_role}</span></td>
                          <td className="font-semibold">{log.action}</td>
                          <td className="mono">{log.target_id?.substring(0, 8)}</td>
                          <td className="table-details-text">{log.details}</td>
                          <td>
                            <span className="status-badge status-success">{log.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="gov-empty-notice">
                  <span className="empty-icon" aria-hidden="true">📜</span>
                  <p className="empty-text">No administrative audit records logged yet in the central ledger.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 11: SETTINGS
              ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="admin-settings-module">
              <div className="settings-section-card">
                <h3 className="section-main-title">Regulatory Authority Session Configuration</h3>
                <div className="settings-field-row">
                  <span className="settings-label">Active Academic Session:</span>
                  <strong className="settings-val">AY 2026-27 (National Admittance Cycle Active)</strong>
                </div>
                <div className="settings-field-row">
                  <span className="settings-label">Statutory Compliance SLA:</span>
                  <strong className="settings-val">14-Day Mandatory Notice Threshold</strong>
                </div>
                <div className="settings-field-row">
                  <span className="settings-label">Connected Central Database:</span>
                  <strong className="settings-val">Supabase PostgreSQL (Live Verified)</strong>
                </div>
                <div className="settings-field-row">
                  <span className="settings-label">Cryptographic Protection:</span>
                  <strong className="settings-val">AES-GCM-256 Envelope Encryption + HMAC Blind Indexing</strong>
                </div>
                <div className="settings-field-row">
                  <span className="settings-label">Administrator Identity:</span>
                  <strong className="settings-val">{user?.email || 'aicte_director@aicte-india.org.synthetic'} ({user?.role})</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Decision Remarks Confirmation Modal */}
      {activeModal && (
        <div className="gov-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="gov-modal-card sm" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <h3 className="modal-title">
                Confirm {activeModal.decision} Decision
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="gov-modal-body">
              <p className="modal-instruction-text">
                Enter administrative remarks for record <strong>{activeModal.item?.name || activeModal.item?.student_ref}</strong>:
              </p>
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Enter regulatory justification or remarks (optional)..."
                className="gov-textarea-input"
                rows={3}
              />
            </div>
            <div className="gov-modal-footer">
              <button
                type="button"
                className="gov-action-btn-secondary"
                onClick={() => setActiveModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={activeModal.decision === 'APPROVED' ? 'gov-btn-approve' : 'gov-btn-reject'}
                onClick={() => {
                  if (activeModal.type === 'onboarding') {
                    handleDecideInstitution(activeModal.item.id, activeModal.decision);
                  } else if (activeModal.type === 'transfer') {
                    handleDecideTransfer(activeModal.item.id, activeModal.decision);
                  }
                }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${activeModal.decision}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
