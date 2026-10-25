import React, { useState, useEffect } from 'react';
import GovernmentHeader from './components/GovernmentHeader';
import Navbar from './components/Navbar';
import GovernmentFooter from './components/GovernmentFooter';
import OverviewPage from './pages/OverviewPage';
import UploadPage from './pages/UploadPage';
import UploadDetailPage from './pages/UploadDetailPage';
import AnomalyReviewPage from './pages/AnomalyReviewPage';
import ReportsPage from './pages/ReportsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
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
      console.warn('Dashboard fetch warning (expected if DB not reachable):', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    loadDashboard();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectUpload = (uploadId) => {
    setSelectedUploadId(uploadId);
    setActiveTab('upload-detail');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Official Government Masthead & Utility Bar */}
      <GovernmentHeader />

      {/* 2. Official Primary Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedUploadId(null);
          setActiveTab(tab);
        }}
        healthStatus={healthStatus}
        readyStatus={readyStatus}
      />

      {/* 3. Official Regulatory Advisory Ticker */}
      <div className="gov-advisory-bar">
        <span className="gov-advisory-badge">Regulatory Advisory</span>
        <span>
          AICTE Central Monitoring Portal (AY 2026-27): All student enrolments are evaluated against sanctioned intake limits.
          Prototype Mode: Strictly synthetic demonstration records.
        </span>
      </div>

      {/* 4. Main Application Workspace */}
      <main className="gov-main-container" style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewPage
            dashboardData={dashboardData}
            loading={loadingDashboard}
            onSelectUpload={handleSelectUpload}
            onNavigateUpload={() => setActiveTab('upload')}
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

        {activeTab === 'reports' && <ReportsPage />}
      </main>

      {/* 5. Official Public-Sector Footer */}
      <GovernmentFooter />
    </div>
  );
}
