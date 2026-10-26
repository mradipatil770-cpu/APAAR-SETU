import React, { useState, useEffect } from 'react';
import GovernmentHeader from './components/GovernmentHeader';
import Navbar from './components/Navbar';
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

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('apaarsetu_lang') || 'en');

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
      {/* 1. Official Government Masthead & Utility Bar */}
      <GovernmentHeader
        currentUser={currentUser}
        onSignIn={() => setCurrentView('login')}
        onSignOut={handleSignOut}
        onGoHome={() => setCurrentView('landing')}
        lang={lang}
        onToggleLang={handleToggleLang}
      />

      {/* 2. Official Primary Navigation Bar (Rendered when in dashboard or when logged in) */}
      {(currentUser || currentView === 'dashboard') && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleNavigate}
          healthStatus={healthStatus}
          readyStatus={readyStatus}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onViewLanding={() => setCurrentView('landing')}
          lang={lang}
        />
      )}

      {/* 3. Official Announcement Notice */}
      <div className="gov-announcement-bar" role="status">
        <div className="gov-announcement-inner">
          <span className="gov-announcement-tag">Notice</span>
          <span className="gov-announcement-text">
            Academic Session 2026–27 Reconciliation Active • Ingestion and compliance verification in progress.
          </span>
          {currentUser && currentView === 'landing' && (
            <button
              className="gov-announcement-link"
              onClick={() => setCurrentView('dashboard')}
            >
              Return to Active Dashboard →
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Application Workspace Routing */}
      <main className="gov-main-container">
        {/* PUBLIC LANDING VIEW */}
        {currentView === 'landing' && (
          <LandingPage
            onGoLogin={() => setCurrentView('login')}
            lang={lang}
            onExploreDirectory={() => {
              if (currentUser) {
                setCurrentView('dashboard');
              } else {
                setCurrentView('login');
              }
            }}
          />
        )}

        {/* LOGIN VIEW */}
        {currentView === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setCurrentView('landing')}
            lang={lang}
          />
        )}

        {/* DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
          <>
            {isCentralUser(currentUser) ? (
              /* CENTRAL REGULATORY DASHBOARD */
              <CentralAicteDashboard
                user={currentUser}
                onSignOut={handleSignOut}
                lang={lang}
              />
            ) : (
              /* INSTITUTIONAL WORKSPACE */
              <>
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
              </>
            )}
          </>
        )}
      </main>

      {/* 5. Official Government Footer */}
      <GovernmentFooter
        onNavigate={(tab) => {
          if (currentUser) {
            setCurrentView('dashboard');
            handleNavigate(tab);
          } else {
            setCurrentView('landing');
          }
        }}
      />
    </div>
  );
}
