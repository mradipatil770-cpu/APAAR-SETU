import React, { useState, useEffect } from 'react';
import GovernmentHeader from './components/GovernmentHeader';
import GovernmentFooter from './components/GovernmentFooter';
import LandingPage from './pages/LandingPage';
import InformationPage from './pages/InformationPage';
import LoginPage from './pages/LoginPage';
import CentralAicteDashboard from './pages/CentralAicteDashboard';
import OverviewPage from './pages/OverviewPage';
import UploadPage from './pages/UploadPage';
import UploadDetailPage from './pages/UploadDetailPage';
import AnomalyReviewPage from './pages/AnomalyReviewPage';
import InstitutionalVerificationsTab from './pages/InstitutionalVerificationsTab';
import InstitutionalTransfersTab from './pages/InstitutionalTransfersTab';
import ReportsPage from './pages/ReportsPage';
import { api } from './services/api';
import { getTranslation } from './i18n/translations';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'info' | 'login' | 'dashboard'
  const [infoCategory, setInfoCategory] = useState('about');
  const [infoSubCategory, setInfoSubCategory] = useState(null);
  const [loginInitialTab, setLoginInitialTab] = useState('login');
  const [activeNav, setActiveNav] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('apaarsetu_lang') || 'en');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Expandable sidebar categories state
  const [expandedMenus, setExpandedMenus] = useState({
    studentData: true,
    verification: true,
    transfers: true,
    reports: true,
  });

  const toggleMenuCategory = (cat) => {
    setExpandedMenus((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    try {
      localStorage.setItem('apaarsetu_lang', nextLang);
    } catch {
      // ignore
    }
  };

  // Institutional tab state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'upload' | 'upload-detail' | 'anomalies' | 'verifications' | 'transfers' | 'reports'
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Institutional student roster & audit logs state
  const [instStudents, setInstStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [instStudentSearch, setInstStudentSearch] = useState('');
  const [instAuditLogs, setInstAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const loadInstitutionalStudents = async (search = null) => {
    try {
      setLoadingStudents(true);
      const data = await api.getInstitutionStudents(search);
      setInstStudents(data?.students || []);
    } catch (err) {
      console.warn('Failed to load institutional students:', err);
      setInstStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadInstitutionalAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const data = await api.getInstitutionAuditLogs(50);
      setInstAuditLogs(data || []);
    } catch (err) {
      console.warn('Failed to load institutional audit logs:', err);
      setInstAuditLogs([]);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // System telemetry state
  const [healthStatus, setHealthStatus] = useState('pending');
  const [readyStatus, setReadyStatus] = useState('pending');

  const checkSystemStatus = async () => {
    try {
      const h = await api.getHealth();
      setHealthStatus(h.status === 'ok' ? 'ok' : 'error');
    } catch {
      setHealthStatus('error');
    }

    try {
      const r = await api.getReadiness();
      setReadyStatus(r.status === 'ready' ? 'ready' : 'unreachable');
    } catch {
      setReadyStatus('unreachable');
    }
  };

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const data = await api.getInstitutionDashboard();
      setDashboardData(data);
    } catch (err) {
      console.warn('Dashboard fetch warning (expected if DB not reachable or unauthorized):', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);

    const savedUserJson = localStorage.getItem('apaarsetu_user');
    const savedToken = localStorage.getItem('apaarsetu_token');

    if (savedUserJson && savedToken) {
      try {
        const parsed = JSON.parse(savedUserJson);
        setCurrentUser(parsed);
        setCurrentView('dashboard');
      } catch (e) {
        localStorage.removeItem('apaarsetu_user');
      }
    }

    return () => clearInterval(interval);
  }, []);

  // When user is institutional and in dashboard view, load institutional dashboard metrics
  useEffect(() => {
    if (currentUser && !isCentralUser(currentUser)) {
      loadDashboard();
    }
  }, [currentUser]);

  function isCentralUser(user) {
    if (!user) return false;
    const r = (user.role || '').toUpperCase();
    return r === 'AICTE_ADMIN' || r === 'AICTE_ANALYST' || r === 'AUDITOR';
  }

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setCurrentView('dashboard');
    setActiveTab('overview');
  };

  const handleSignOut = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentView('landing');
    setActiveTab('overview');
  };

  const handleSelectUpload = (uploadId) => {
    setSelectedUploadId(uploadId);
    setActiveTab('upload-detail');
  };

  const handleNavigate = (tab) => {
    setSelectedUploadId(null);
    setActiveTab(tab);
    if (tab === 'student-records') {
      loadInstitutionalStudents();
    } else if (tab === 'audit-log') {
      loadInstitutionalAuditLogs();
    }
  };

  return (
    <div className="gov-app-root">
      {/* 1. Official Government Masthead & Utility Bar (Shown on Landing, Login, or Top) */}
      <GovernmentHeader
        currentUser={currentUser}
        onSignIn={() => {
          setLoginInitialTab('login');
          setCurrentView('login');
        }}
        onRegister={() => {
          setLoginInitialTab('register');
          setCurrentView('login');
        }}
        onSignOut={handleSignOut}
        onGoHome={() => {
          setActiveNav('home');
          setCurrentView('landing');
        }}
        activeNav={activeNav}
        onNavClick={(item, subItem) => {
          setActiveNav(item);
          if (item === 'home') {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setInfoCategory(item);
            setInfoSubCategory(subItem);
            setCurrentView('info');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        lang={lang}
        onToggleLang={handleToggleLang}
      />

      {/* 2. Main Application Workspace Routing */}
      <main className="gov-main-container">
        {/* PUBLIC LANDING VIEW */}
        {currentView === 'landing' && (
          <LandingPage
            onGoLogin={() => {
              setLoginInitialTab('login');
              setCurrentView('login');
            }}
            onGoRegister={() => {
              setLoginInitialTab('register');
              setCurrentView('login');
            }}
            onNavigatePage={(pageKey) => {
              setActiveNav(pageKey);
              setInfoCategory(pageKey);
              setInfoSubCategory(null);
              setCurrentView('info');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            lang={lang}
          />
        )}

        {/* DEDICATED INFORMATION PAGES (About, Workflow, Stakeholders, Help/FAQ, News) */}
        {currentView === 'info' && (
          <InformationPage
            category={infoCategory}
            subCategory={infoSubCategory}
            onGoHome={() => {
              setActiveNav('home');
              setCurrentView('landing');
            }}
            onGoLogin={() => {
              setLoginInitialTab('login');
              setCurrentView('login');
            }}
            onGoRegister={() => {
              setLoginInitialTab('register');
              setCurrentView('login');
            }}
            lang={lang}
          />
        )}

        {/* LOGIN VIEW */}
        {currentView === 'login' && (
          <LoginPage
            initialTab={loginInitialTab}
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => {
              setCurrentView('landing');
              setActiveNav('home');
            }}
            lang={lang}
          />
        )}

        {/* DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
          <>
            {isCentralUser(currentUser) ? (
              /* CENTRAL REGULATORY DASHBOARD (Reference Image 2) */
              <CentralAicteDashboard
                user={currentUser}
                onSignOut={handleSignOut}
                lang={lang}
              />
            ) : (
              /* INSTITUTIONAL WORKSPACE (KIT College of Engineering, Kolhapur) */
              <div className="gov-inst-shell">
                {/* Left Dark Navy Navigation Sidebar */}
                <aside className={`gov-inst-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                  <div className="inst-sidebar-header">
                    <div className="inst-logo-crest" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="crest-svg">
                        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z" />
                      </svg>
                    </div>
                    <div className="inst-brand-text-wrap">
                      <h2 className="inst-brand-title">APAARSetu</h2>
                      <span className="inst-brand-sub">KIT Kolhapur</span>
                    </div>
                  </div>

                  <nav className="inst-sidebar-nav" aria-label="Institutional Navigation">
                    {/* 1. Dashboard */}
                    <button
                      type="button"
                      className={`inst-menu-btn ${activeTab === 'overview' ? 'active' : ''}`}
                      onClick={() => handleNavigate('overview')}
                    >
                      <span className="inst-icon">🏛️</span>
                      <span className="inst-label">{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
                    </button>

                    {/* 2. Student Data Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('studentData')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">📁</span>
                          <span>{lang === 'hi' ? 'विद्यार्थी डेटा' : 'Student Data'}</span>
                        </div>
                        <span className="category-arrow">{expandedMenus.studentData ? '▾' : '▸'}</span>
                      </button>
                      {expandedMenus.studentData && (
                        <div className="inst-submenu-list">
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'upload' ? 'active' : ''}`}
                            onClick={() => handleNavigate('upload')}
                          >
                            <span>{lang === 'hi' ? 'डेटा अपलोड (CSV)' : 'Upload Records'}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'student-records' ? 'active' : ''}`}
                            onClick={() => handleNavigate('student-records')}
                          >
                            <span>{lang === 'hi' ? 'छात्र रिकॉर्ड देखें' : 'View Records'}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'validation' ? 'active' : ''}`}
                            onClick={() => handleNavigate('validation')}
                          >
                            <span>{lang === 'hi' ? 'सत्यापन परिणाम' : 'Validation Results'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Verification & Anomaly Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('verification')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">🔍</span>
                          <span>{lang === 'hi' ? 'सत्यापन एवं विसंगतियां' : 'Verification & Anomaly'}</span>
                        </div>
                        <span className="category-arrow">{expandedMenus.verification ? '▾' : '▸'}</span>
                      </button>
                      {expandedMenus.verification && (
                        <div className="inst-submenu-list">
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'duplicates' ? 'active' : ''}`}
                            onClick={() => handleNavigate('duplicates')}
                          >
                            <span>{lang === 'hi' ? 'दोहरी प्रविष्टि समीक्षा' : 'Duplicate Review'}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'missing-data' ? 'active' : ''}`}
                            onClick={() => handleNavigate('missing-data')}
                          >
                            <span>{lang === 'hi' ? 'अपूर्ण डेटा समीक्षा' : 'Missing Data'}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'intake-verification' ? 'active' : ''}`}
                            onClick={() => handleNavigate('intake-verification')}
                          >
                            <span>{lang === 'hi' ? 'प्रवेश क्षमता सत्यापन' : 'Intake Verification'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4. Student Transfers Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('transfers')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">🔄</span>
                          <span>{lang === 'hi' ? 'छात्र स्थानांतरण' : 'Student Transfers'}</span>
                        </div>
                        <span className="category-arrow">{expandedMenus.transfers ? '▾' : '▸'}</span>
                      </button>
                      {expandedMenus.transfers && (
                        <div className="inst-submenu-list">
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'transfers' ? 'active' : ''}`}
                            onClick={() => handleNavigate('transfers')}
                          >
                            <span>{lang === 'hi' ? 'स्थानांतरण अनुरोध' : 'Transfer Requests'}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'noc-ledger' ? 'active' : ''}`}
                            onClick={() => handleNavigate('noc-ledger')}
                          >
                            <span>{lang === 'hi' ? 'एनओसी लेजर' : 'NOC Ledger'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 5. Reports Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('reports')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">📊</span>
                          <span>{lang === 'hi' ? 'रिपोर्ट्स' : 'Reports'}</span>
                        </div>
                        <span className="category-arrow">{expandedMenus.reports ? '▾' : '▸'}</span>
                      </button>
                      {expandedMenus.reports && (
                        <div className="inst-submenu-list">
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => handleNavigate('reports')}
                          >
                            <span>{lang === 'hi' ? 'अनुपालन रिपोर्ट' : 'Compliance Reports'}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'audit-log' ? 'active' : ''}`}
                            onClick={() => handleNavigate('audit-log')}
                          >
                            <span>{lang === 'hi' ? 'ऑडिट लॉग' : 'Audit Log'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6. Settings */}
                    <button
                      type="button"
                      className={`inst-menu-btn ${activeTab === 'settings' ? 'active' : ''}`}
                      onClick={() => handleNavigate('settings')}
                    >
                      <span className="inst-icon">⚙️</span>
                      <span className="inst-label">{lang === 'hi' ? 'सेटिंग्स एवं प्रोफाइल' : 'Settings'}</span>
                    </button>
                  </nav>
                </aside>

                {/* Right Main Institutional Pane */}
                <div className="gov-inst-main-pane">
                  {/* Top Institutional Identity Strip */}
                  <div className="gov-inst-topbar-strip">
                    <div className="inst-topbar-strip-left">
                      <button
                        type="button"
                        className="inst-hamburger-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title="Toggle Navigation Sidebar"
                        aria-label="Toggle Navigation Sidebar"
                      >
                        ☰
                      </button>
                      <div className="inst-meta-banner">
                        <span className="inst-name-prominent">
                          {dashboardData?.institution_name || currentUser?.institution_name || 'KIT College of Engineering, Kolhapur'}
                        </span>
                        <span className="inst-meta-sep">|</span>
                        <span className="inst-meta-code">
                          {lang === 'hi' ? 'एआईसीटीई स्थिति: स्वीकृत' : 'AICTE Status: Approved Technical Institution'}
                        </span>
                        <span className="inst-meta-sep">·</span>
                        <span className="inst-meta-code">
                          AICTE Permanent ID: <span className="mono">{currentUser?.institution_code || '[Pending Official Allocation]'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="inst-topbar-strip-right">
                      <span className="inst-current-session">Session: <strong>2026-27</strong></span>
                    </div>
                  </div>

                  {/* Active Tab Routing Container */}
                  <div className="gov-inst-body-content">
                    {/* 1. Dashboard Overview */}
                    {activeTab === 'overview' && (
                      <OverviewPage
                        dashboardData={dashboardData}
                        loading={loadingDashboard}
                        onSelectUpload={handleSelectUpload}
                        onNavigateUpload={() => handleNavigate('upload')}
                        onNavigateTab={handleNavigate}
                        currentUser={currentUser}
                        lang={lang}
                      />
                    )}

                    {/* 2. Upload Records */}
                    {activeTab === 'upload' && (
                      <UploadPage
                        onUploadComplete={() => {
                          loadDashboard();
                        }}
                        onSelectUpload={handleSelectUpload}
                      />
                    )}

                    {/* Upload Detail Batch View */}
                    {activeTab === 'upload-detail' && (
                      <UploadDetailPage
                        uploadId={selectedUploadId}
                        onBack={() => {
                          setSelectedUploadId(null);
                          setActiveTab('overview');
                        }}
                      />
                    )}

                    {/* 3. View Student Records */}
                    {activeTab === 'student-records' && (
                      <div className="gov-page">
                        <div className="gov-section-header">
                          <div>
                            <h2 className="gov-section-title">
                              {lang === 'hi' ? 'संस्थागत छात्र रिकॉर्ड निर्देशिका' : 'Institutional Student Records'}
                            </h2>
                            <p className="gov-section-subtitle">
                              {lang === 'hi'
                                ? 'अपार एवं शैक्षणिक डेटाबेस में नामांकित संस्था के छात्रों की सूची एवं सत्यापन स्थिति।'
                                : 'Master roster of students enrolled at KIT College of Engineering, Kolhapur with masked APAAR identifiers.'}
                            </p>
                          </div>
                        </div>

                        {/* Search and Filters Bar */}
                        <div className="gov-table-filters-bar">
                          <input
                            type="text"
                            className="gov-search-input"
                            placeholder="Search by student reference (e.g. STU-2026) or masked APAAR..."
                            value={instStudentSearch}
                            onChange={(e) => setInstStudentSearch(e.target.value)}
                          />
                          <button
                            type="button"
                            className="gov-btn gov-btn-primary"
                            onClick={() => loadInstitutionalStudents(instStudentSearch)}
                          >
                            Filter Records
                          </button>
                        </div>

                        {loadingStudents ? (
                          <div className="gov-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="gov-spinner" aria-hidden="true" />
                            <p style={{ marginTop: '12px', color: '#64748B' }}>Loading student records...</p>
                          </div>
                        ) : instStudents.length === 0 ? (
                          <div className="gov-empty-card">
                            <div className="empty-icon">👥</div>
                            <h3>No Student Records Found</h3>
                            <p>No student records are currently enrolled for this institution in the database.</p>
                            <button
                              type="button"
                              className="gov-btn gov-btn-primary"
                              onClick={() => handleNavigate('upload')}
                              style={{ marginTop: '12px' }}
                            >
                              Upload Student CSV
                            </button>
                          </div>
                        ) : (
                          <div className="gov-table-wrapper">
                            <table className="gov-clean-table">
                              <thead>
                                <tr>
                                  <th>Student Reference</th>
                                  <th>Masked APAAR ID</th>
                                  <th>Programme</th>
                                  <th>Academic Year</th>
                                  <th>Status</th>
                                  <th>Recorded At</th>
                                </tr>
                              </thead>
                              <tbody>
                                {instStudents.map((s) => (
                                  <tr key={s.id}>
                                    <td className="font-semibold mono">{s.student_ref}</td>
                                    <td className="mono">{s.apaar_id_masked}</td>
                                    <td>
                                      <strong>{s.programme_code}</strong>
                                      <span className="table-cell-sub"> {s.programme_name}</span>
                                    </td>
                                    <td>{s.academic_year}</td>
                                    <td>
                                      <span className="status-badge badge-active">{s.enrolment_status}</span>
                                    </td>
                                    <td className="table-cell-sub">
                                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Active'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Validation Results / Exceptions */}
                    {activeTab === 'validation' && (
                      <AnomalyReviewPage
                        onAnomalyUpdated={() => {
                          loadDashboard();
                        }}
                      />
                    )}

                    {/* 5. Duplicate Review */}
                    {activeTab === 'duplicates' && (
                      <AnomalyReviewPage
                        onAnomalyUpdated={() => {
                          loadDashboard();
                        }}
                      />
                    )}

                    {/* 6. Missing Data */}
                    {activeTab === 'missing-data' && (
                      <AnomalyReviewPage
                        onAnomalyUpdated={() => {
                          loadDashboard();
                        }}
                      />
                    )}

                    {/* 7. Intake Verification */}
                    {activeTab === 'intake-verification' && (
                      <div className="gov-page">
                        <div className="gov-section-header">
                          <div>
                            <h2 className="gov-section-title">
                              {lang === 'hi' ? 'स्वीकृत प्रवेश क्षमता सत्यापन' : 'Approved Intake Quota Verification'}
                            </h2>
                            <p className="gov-section-subtitle">
                              {lang === 'hi'
                                ? 'एआईसीटीई द्वारा अनुमोदित प्रवेश कोटा के विरुद्ध वास्तविक नामांकन एवं क्षमता उपयोग।'
                                : 'Monitor programme intake quotas approved by AICTE against actual student admissions for KIT College of Engineering, Kolhapur.'}
                            </p>
                          </div>
                        </div>

                        {dashboardData?.programme_stats && dashboardData.programme_stats.length > 0 ? (
                          <div className="gov-table-wrapper">
                            <table className="gov-clean-table">
                              <thead>
                                <tr>
                                  <th>Programme Code</th>
                                  <th>Programme Name</th>
                                  <th>Academic Year</th>
                                  <th style={{ textAlign: 'right' }}>Approved Intake</th>
                                  <th style={{ textAlign: 'right' }}>Enrolled Students</th>
                                  <th style={{ textAlign: 'right' }}>Capacity Utilization</th>
                                  <th>Compliance Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dashboardData.programme_stats.map((prog, idx) => (
                                  <tr key={idx}>
                                    <td className="font-semibold mono">{prog.programme_code}</td>
                                    <td>{prog.programme_name}</td>
                                    <td>{prog.academic_year}</td>
                                    <td style={{ textAlign: 'right' }} className="mono">{prog.approved_intake}</td>
                                    <td style={{ textAlign: 'right' }} className="mono font-semibold">{prog.enrolled_count}</td>
                                    <td style={{ textAlign: 'right' }} className="mono">
                                      {prog.approved_intake > 0
                                        ? `${Math.round((prog.enrolled_count / prog.approved_intake) * 100)}%`
                                        : '0%'}
                                    </td>
                                    <td>
                                      {prog.enrolled_count > prog.approved_intake ? (
                                        <span className="status-badge badge-warning">⚠ Exceeded Quota</span>
                                      ) : (
                                        <span className="status-badge badge-active">✓ Within Approved Quota</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="gov-empty-card">
                            <div className="empty-icon">📋</div>
                            <h3>No Intake Profiles Configured</h3>
                            <p>Programme intake quotas have not been seeded or configured for the current session.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 8. Transfer Requests */}
                    {activeTab === 'transfers' && (
                      <InstitutionalTransfersTab currentUser={currentUser} lang={lang} />
                    )}

                    {/* 9. NOC Ledger */}
                    {activeTab === 'noc-ledger' && (
                      <InstitutionalTransfersTab currentUser={currentUser} lang={lang} />
                    )}

                    {/* 10. Compliance Reports */}
                    {activeTab === 'reports' && (
                      <ReportsPage currentUser={currentUser} />
                    )}

                    {/* 11. Audit Log */}
                    {activeTab === 'audit-log' && (
                      <div className="gov-page">
                        <div className="gov-section-header">
                          <div>
                            <h2 className="gov-section-title">
                              {lang === 'hi' ? 'संस्थागत नियामक ऑडिट लॉग' : 'Institutional Regulatory Audit Log'}
                            </h2>
                            <p className="gov-section-subtitle">
                              {lang === 'hi'
                                ? 'संस्थान द्वारा निष्पादित सभी छात्र डेटा प्रबंधन, एनओसी तथा सत्यापन गतिविधियों का अपरिवर्तनीय ऑडिट ट्रेल।'
                                : 'Immutable audit trail of all student record modifications, verification requests, and administrative determinations.'}
                            </p>
                          </div>
                        </div>

                        {loadingAuditLogs ? (
                          <div className="gov-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="gov-spinner" aria-hidden="true" />
                            <p style={{ marginTop: '12px', color: '#64748B' }}>Loading audit logs...</p>
                          </div>
                        ) : instAuditLogs.length === 0 ? (
                          <div className="gov-empty-card">
                            <div className="empty-icon">🛡️</div>
                            <h3>No Audit Log Entries Recorded</h3>
                            <p>Regulatory actions performed by institutional staff will be logged here with cryptographic timestamps.</p>
                          </div>
                        ) : (
                          <div className="gov-table-wrapper">
                            <table className="gov-clean-table">
                              <thead>
                                <tr>
                                  <th>Timestamp (UTC)</th>
                                  <th>Actor Role</th>
                                  <th>Action Executed</th>
                                  <th>Target Reference</th>
                                  <th>Audit Status</th>
                                  <th>Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                {instAuditLogs.map((log) => (
                                  <tr key={log.id}>
                                    <td className="table-cell-sub">
                                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                                    </td>
                                    <td>
                                      <span className="status-badge badge-active">{log.actor_role}</span>
                                    </td>
                                    <td className="font-semibold">{log.action}</td>
                                    <td className="mono">{log.target_id || '—'}</td>
                                    <td>
                                      <span className="status-badge badge-active">{log.status}</span>
                                    </td>
                                    <td className="table-cell-sub" style={{ maxWidth: '300px' }}>
                                      {log.details || 'System event'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 12. Settings & Profile */}
                    {activeTab === 'settings' && (
                      <div className="gov-page">
                        <div className="gov-section-header">
                          <div>
                            <h2 className="gov-section-title">
                              {lang === 'hi' ? 'संस्थान प्रोफाइल एवं सुरक्षा सेटिंग्स' : 'Institutional Profile & Security'}
                            </h2>
                            <p className="gov-section-subtitle">
                              {lang === 'hi'
                                ? 'संस्थागत पहचान, संबद्धता विवरण तथा क्रिप्टोग्राफिक डेटा सुरक्षा विन्यास।'
                                : 'Verified institutional identity, AICTE affiliation parameters, and regulatory privacy controls.'}
                            </p>
                          </div>
                        </div>

                        <div className="gov-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                          <div className="gov-card-header">
                            <h3 className="gov-card-title">Verified Institutional Identity</h3>
                            <span className="status-badge badge-active">AICTE Approved</span>
                          </div>

                          <div className="settings-grid">
                            <div className="settings-row">
                              <span className="settings-key">Institution Name:</span>
                              <strong className="settings-val">KIT College of Engineering, Kolhapur</strong>
                            </div>
                            <div className="settings-row">
                              <span className="settings-key">AICTE Permanent Code:</span>
                              <span className="mono settings-val">{currentUser?.institution_code || '[Pending Official Allocation]'}</span>
                            </div>
                            <div className="settings-row">
                              <span className="settings-key">Institutional Portal Account:</span>
                              <span className="settings-val">{currentUser?.email || 'registrar@kit-kolhapur.edu.in'}</span>
                            </div>
                            <div className="settings-row">
                              <span className="settings-key">Authorized Role:</span>
                              <span className="settings-val">
                                {currentUser?.role === 'institution_admin' ? 'College Registrar / Administrator' : currentUser?.role}
                              </span>
                            </div>
                            <div className="settings-row">
                              <span className="settings-key">Jurisdiction / Region:</span>
                              <span className="settings-val">Western Regional Office (WRO), AICTE</span>
                            </div>
                            <div className="settings-row">
                              <span className="settings-key">Data Privacy Profile:</span>
                              <span className="settings-val">
                                AES-256-GCM Column-Level Encryption · Blind Token HMAC Indexing
                              </span>
                            </div>
                            <div className="settings-row">
                              <span className="settings-key">Institutional Status:</span>
                              <span className="status-badge badge-active">Active & In Good Standing</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Official Government Footer */}
      <GovernmentFooter
        onNavigate={(tab) => {
          if (currentUser) {
            setCurrentView('dashboard');
            handleNavigate(tab);
          } else {
            setCurrentView('landing');
          }
        }}
        lang={lang}
      />
    </div>
  );
}
