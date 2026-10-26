import React, { useState, useEffect } from 'react';
import GovernmentHeader from './components/GovernmentHeader';
import GovernmentFooter from './components/GovernmentFooter';
import LandingPage from './pages/LandingPage';
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
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'dashboard'
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
        onNavClick={(item) => {
          setActiveNav(item);
          if (currentView !== 'landing') {
            setCurrentView('landing');
          }
          if (item === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setTimeout(() => {
              const el = document.getElementById(item);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }, 50);
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
              /* INSTITUTIONAL WORKSPACE (Reference Image 1 Middle) */
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
                    </div>
                  </div>

                  <nav className="inst-sidebar-nav" aria-label="Institutional Portal Navigation">
                    {/* Dashboard Link */}
                    <button
                      type="button"
                      className={`inst-menu-btn ${activeTab === 'overview' ? 'active' : ''}`}
                      onClick={() => handleNavigate('overview')}
                    >
                      <span className="inst-icon">🏠</span>
                      <span className="inst-label">{getTranslation('sidebarDashboard', lang)}</span>
                    </button>

                    {/* Student Data Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('studentData')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">📁</span>
                          <span>{getTranslation('sidebarStudentData', lang)}</span>
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
                            <span>{getTranslation('sidebarDataUpload', lang)}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'upload-detail' ? 'active' : ''}`}
                            onClick={() => handleNavigate('overview')}
                          >
                            <span>{getTranslation('sidebarStudentRecords', lang)}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
                            onClick={() => handleNavigate('anomalies')}
                          >
                            <span>{getTranslation('sidebarDataValidation', lang)}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Verification Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('verification')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">⚖️</span>
                          <span>{getTranslation('sidebarVerification', lang)}</span>
                        </div>
                        <span className="category-arrow">{expandedMenus.verification ? '▾' : '▸'}</span>
                      </button>
                      {expandedMenus.verification && (
                        <div className="inst-submenu-list">
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
                            onClick={() => handleNavigate('anomalies')}
                          >
                            <span>{getTranslation('sidebarDuplicateCheck', lang)}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
                            onClick={() => handleNavigate('anomalies')}
                          >
                            <span>{getTranslation('sidebarMissingData', lang)}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'verifications' ? 'active' : ''}`}
                            onClick={() => handleNavigate('verifications')}
                          >
                            <span>{getTranslation('sidebarIntakeCheck', lang)}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Transfers Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('transfers')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">🔄</span>
                          <span>{getTranslation('sidebarTransfers', lang)}</span>
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
                            <span>{getTranslation('sidebarTransferReq', lang)}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'transfers' ? 'active' : ''}`}
                            onClick={() => handleNavigate('transfers')}
                          >
                            <span>{getTranslation('sidebarNocLedger', lang)}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reports Category */}
                    <div className="inst-menu-category">
                      <button
                        type="button"
                        className="inst-category-trigger"
                        onClick={() => toggleMenuCategory('reports')}
                      >
                        <div className="trigger-label-group">
                          <span className="inst-icon">📑</span>
                          <span>{getTranslation('sidebarReports', lang)}</span>
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
                            <span>{getTranslation('sidebarComplianceReport', lang)}</span>
                          </button>
                          <button
                            type="button"
                            className={`inst-submenu-btn ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => handleNavigate('reports')}
                          >
                            <span>{getTranslation('sidebarAuditLog', lang)}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Settings */}
                    <button
                      type="button"
                      className="inst-menu-btn"
                      onClick={() => handleNavigate('overview')}
                    >
                      <span className="inst-icon">⚙️</span>
                      <span className="inst-label">{getTranslation('sidebarSettings', lang)}</span>
                    </button>
                  </nav>
                </aside>

                {/* Right Main Institutional Pane */}
                <div className="gov-inst-main-pane">
                  {/* Top Institutional Header Bar (Reference Image 1) */}
                  <header className="gov-inst-topbar">
                    <div className="inst-topbar-left">
                      <button
                        type="button"
                        className="inst-hamburger-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title="Toggle Navigation Sidebar"
                        aria-label="Toggle Navigation Sidebar"
                      >
                        ☰
                      </button>
                      <div className="inst-title-badge-group">
                        <span className="inst-badge-icon">🏛️</span>
                        <div>
                          <strong className="inst-name-text">
                            {dashboardData?.institution_name || currentUser?.institution_name || 'Delhi Institute of Engineering & Technology'}
                          </strong>
                          <div className="inst-id-subtext">
                            संस्था आयडी (AICTE ID): <span className="mono">{dashboardData?.institution_id?.substring(0, 8) || 'AICTE-ENG-001'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="inst-topbar-right">
                      {/* Notification Bell */}
                      <button type="button" className="inst-notif-btn" title="Notifications" aria-label="Notifications">
                        🔔<span className="notif-count-badge">1</span>
                      </button>

                      {/* User Profile avatar */}
                      <div className="inst-user-profile-badge">
                        <div className="profile-circle-avatar">👤</div>
                        <div className="profile-text-wrap">
                          <span className="profile-name">
                            {lang === 'hi' ? 'प्रशासक' : 'Administrator'}
                          </span>
                          <span className="profile-role">
                            {lang === 'hi' ? 'संस्था ऑपरेटर' : 'Institute Operator'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="gov-btn-signout sm"
                        onClick={handleSignOut}
                        title="Sign Out"
                      >
                        {getTranslation('navLogout', lang)}
                      </button>
                    </div>
                  </header>

                  {/* Active Tab Routing Container */}
                  <div className="gov-inst-body-content">
                    {activeTab === 'overview' && (
                      <OverviewPage
                        dashboardData={dashboardData}
                        loading={loadingDashboard}
                        onSelectUpload={handleSelectUpload}
                        onNavigateUpload={() => handleNavigate('upload')}
                        currentUser={currentUser}
                        lang={lang}
                      />
                    )}

                    {activeTab === 'upload' && (
                      <UploadPage
                        onUploadComplete={() => {
                          loadDashboard();
                        }}
                        onSelectUpload={handleSelectUpload}
                      />
                    )}

                    {activeTab === 'upload-detail' && (
                      <UploadDetailPage
                        uploadId={selectedUploadId}
                        onBack={() => {
                          setSelectedUploadId(null);
                          setActiveTab('overview');
                        }}
                      />
                    )}

                    {activeTab === 'anomalies' && (
                      <AnomalyReviewPage
                        onAnomalyUpdated={() => {
                          loadDashboard();
                        }}
                      />
                    )}

                    {activeTab === 'verifications' && (
                      <InstitutionalVerificationsTab currentUser={currentUser} />
                    )}

                    {activeTab === 'transfers' && (
                      <InstitutionalTransfersTab currentUser={currentUser} lang={lang} />
                    )}

                    {activeTab === 'reports' && (
                      <ReportsPage currentUser={currentUser} />
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
