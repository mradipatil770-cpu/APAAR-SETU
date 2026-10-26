import React, { useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../i18n/translations';

export default function LoginPage({ onLoginSuccess, onCancel, lang = 'en' }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('H J T D S');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regType, setRegType] = useState('CENTRAL_STATE_AFFILIATED');
  const [regContactName, setRegContactName] = useState('');
  const [regContactDesignation, setRegContactDesignation] = useState('Principal / Director');
  const [regContactPhone, setRegContactPhone] = useState('');
  const [regState, setRegState] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  // Pre-configured demonstration personas for SIH evaluation
  const demoPersonas = [
    {
      label: 'Central AICTE Director',
      role: 'AICTE_ADMIN',
      email: 'aicte_director@aicte-india.org.synthetic',
      description: 'National regulatory oversight, institution approvals, and national quota tracking.',
    },
    {
      label: 'AICTE Regulatory Analyst',
      role: 'AICTE_ANALYST',
      email: 'analyst@aicte-india.org.synthetic',
      description: 'Cross-institution duplicate candidate triage and collision analysis.',
    },
    {
      label: 'Central Compliance Auditor',
      role: 'AUDITOR',
      email: 'auditor@aicte-india.org.synthetic',
      description: 'Read-only regulatory compliance inspection and national audit reports.',
    },
    {
      label: 'Institutional Registrar (Delhi Tech — Active)',
      role: 'INSTITUTE_ADMIN',
      email: 'demo_admin@delhi-tech.edu.synthetic',
      description: 'Batch student CSV upload, anomaly resolution, and academic verification ledger.',
    },
    {
      label: 'SV Regional Institute (Pending Verification)',
      role: 'INSTITUTE_ADMIN',
      email: 'principal@svrit-nagpur.ac.in.synthetic',
      description: 'Demonstrates non-privileged isolation: Upload restricted until AICTE Central approval.',
    },
  ];

  const handlePopulateEmail = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo_password_2026');
    setCaptchaInput(captchaCode.replace(/\s+/g, ''));
    setErrorMessage(null);
  };

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length)) + (i < 4 ? ' ' : '');
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your registered official email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.login(email.trim(), password);
      localStorage.setItem('apaarsetu_token', response.access_token);
      localStorage.setItem('apaarsetu_user', JSON.stringify(response));

      if (onLoginSuccess) {
        onLoginSuccess(response);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials or unauthorized account. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-enter.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.registerInstitution({
        name: regName.trim(),
        code: regCode.trim().toUpperCase(),
        institution_type: regType,
        contact_name: regContactName.trim(),
        contact_designation: regContactDesignation.trim(),
        contact_phone: regContactPhone.trim(),
        state: regState.trim(),
        address: regAddress.trim(),
        admin_email: regEmail.trim().toLowerCase(),
        password: regPassword,
      });

      setSuccessMessage(
        `Application Submitted Successfully! Institution Code: ${response.code}. Current Status: ${response.status}. The AICTE Central Regulatory Bureau must review and approve your credentials before batch student upload services activate.`
      );
      setEmail(regEmail.trim().toLowerCase());
      setPassword(regPassword);
      setActiveTab('login');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. An institution or email with this identifier may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Please provide your official registered email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setSuccessMessage(res.message);
      setForgotEmail('');
    } catch (err) {
      setErrorMessage('Unable to process password recovery request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mahadbt-landing-root">
      {/* 1. MahaDBT Top Red Announcement Strip */}
      <div className="mahadbt-alert-ticker" role="region" aria-label="Portal Directive">
        <div className="mahadbt-alert-ticker-inner">
          <span className="mahadbt-alert-badge">Notice</span>
          <span className="mahadbt-alert-text">
            {getTranslation('tickerNotice', lang)}
          </span>
        </div>
      </div>

      {/* 2. Three-Column Grid Layout (MahaDBT Reference) */}
      <div className="mahadbt-layout-grid">
        {/* Left Column: Guidelines & Notices */}
        <aside className="mahadbt-col-left" aria-label="Guidelines and Notices">
          <div className="mahadbt-panel">
            <div className="mahadbt-panel-header primary-blue">
              <h3>{getTranslation('userManualsTitle', lang)}</h3>
            </div>
            <div className="mahadbt-guidelines-list">
              <a href="#guide-intake" className="mahadbt-guide-item" onClick={(e) => e.preventDefault()}>
                <span className="guide-icon">📋</span>
                <span className="guide-label">{getTranslation('guidelinesIntake', lang)}</span>
              </a>
              <a href="#guide-apaar" className="mahadbt-guide-item" onClick={(e) => e.preventDefault()}>
                <span className="guide-icon">🆔</span>
                <span className="guide-label">{getTranslation('guidelinesApaar', lang)}</span>
              </a>
              <a href="#guide-transfers" className="mahadbt-guide-item" onClick={(e) => e.preventDefault()}>
                <span className="guide-icon">🔄</span>
                <span className="guide-label">{getTranslation('guidelinesTransfers', lang)}</span>
              </a>
            </div>
          </div>

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
            </div>
          </div>
        </aside>

        {/* Center Column: Authentication & Instructions Panel */}
        <section className="mahadbt-col-center" aria-label="Authentication Box">
          <div className="mahadbt-auth-card">
            {/* Mode Tabs */}
            <div className="gov-auth-tabs" role="tablist" aria-label="Authentication Options">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                className={`gov-auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
              >
                {getTranslation('navLogin', lang)}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                className={`gov-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                {getTranslation('navRegister', lang)}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'forgot'}
                className={`gov-auth-tab ${activeTab === 'forgot' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('forgot');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                {getTranslation('forgotPasswordLink', lang)}
              </button>
            </div>

            {/* Global Feedback Messages */}
            {errorMessage && (
              <div className="gov-auth-alert error" role="alert">
                <span className="alert-symbol">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="gov-auth-alert success" role="status">
                <span className="alert-symbol">✓</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: LOGIN (Dual-Pane MahaDBT Layout) */}
            {activeTab === 'login' && (
              <div className="mahadbt-login-dual-pane">
                {/* Left Sub-pane: Login Form */}
                <div className="mahadbt-login-form-box">
                  <div className="form-sub-header">
                    <span className="header-arrow">➔</span>
                    <h3>{getTranslation('applicantLogin', lang)}</h3>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="gov-form" noValidate>
                    <div className="gov-form-group">
                      <label htmlFor="auth-email" className="gov-form-label">
                        {getTranslation('officialEmail', lang)} <span className="req">*</span>
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        className="gov-form-input"
                        placeholder="e.g. registrar@institution.edu.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="gov-form-group">
                      <div className="gov-label-row">
                        <label htmlFor="auth-password" className="gov-form-label">
                          {getTranslation('password', lang)} <span className="req">*</span>
                        </label>
                      </div>
                      <div className="gov-input-wrapper">
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          className="gov-form-input"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          className="gov-btn-input-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {/* Captcha Security Verification Box (MahaDBT Style) */}
                    <div className="mahadbt-captcha-box">
                      <div className="captcha-display-row">
                        <div className="captcha-graphic" aria-label="Security captcha code">
                          <span className="captcha-letters">{captchaCode}</span>
                        </div>
                        <button
                          type="button"
                          className="captcha-refresh-btn"
                          onClick={refreshCaptcha}
                          title={getTranslation('captchaRefresh', lang)}
                        >
                          🔄 {getTranslation('captchaRefresh', lang)}
                        </button>
                      </div>
                      <input
                        type="text"
                        className="gov-form-input captcha-input"
                        placeholder="Enter the text shown above"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    <div className="mahadbt-login-actions-row">
                      <button
                        type="submit"
                        className="gov-btn gov-btn-primary mahadbt-btn-login"
                        disabled={loading}
                      >
                        {loading ? 'Authenticating...' : getTranslation('loginButton', lang)}
                      </button>
                      <button
                        type="button"
                        className="gov-btn gov-btn-outline"
                        onClick={() => setActiveTab('forgot')}
                      >
                        {getTranslation('forgotPasswordLink', lang)}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Sub-pane: Instructions Panel (MahaDBT Reference) */}
                <div className="mahadbt-login-instructions-box">
                  <div className="instructions-header">
                    <h4>{getTranslation('loginInstructionsTitle', lang)}</h4>
                  </div>
                  <ul className="instructions-list">
                    <li>
                      <span className="bullet-icon">📄</span>
                      <span>{getTranslation('inst1', lang)}</span>
                    </li>
                    <li>
                      <span className="bullet-icon">📄</span>
                      <span>{getTranslation('inst2', lang)}</span>
                    </li>
                    <li>
                      <span className="bullet-icon">📄</span>
                      <span>{getTranslation('inst3', lang)}</span>
                    </li>
                    <li>
                      <span className="bullet-icon">📄</span>
                      <span>{getTranslation('inst4', lang)}</span>
                    </li>
                    <li>
                      <span className="bullet-icon">📄</span>
                      <span>{getTranslation('inst5', lang)}</span>
                    </li>
                    <li>
                      <span className="bullet-icon">📄</span>
                      <span>{getTranslation('inst6', lang)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: REGISTER NEW INSTITUTION */}
            {activeTab === 'register' && (
              <div className="gov-auth-tab-content">
                <div className="gov-auth-header">
                  <h2 className="gov-auth-title">{getTranslation('registerTitle', lang)}</h2>
                  <p className="gov-auth-subtitle">{getTranslation('registerSubtitle', lang)}</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="gov-form" noValidate>
                  <div className="gov-form-grid-2">
                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        {getTranslation('instituteName', lang)} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="gov-form-input"
                        placeholder="e.g. Sardar Patel Institute of Technology"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        {getTranslation('instituteCode', lang)} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="gov-form-input"
                        placeholder="e.g. AICTE-WEST-2026-99"
                        value={regCode}
                        onChange={(e) => setRegCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="gov-form-grid-2">
                    <div className="gov-form-group">
                      <label className="gov-form-label">{getTranslation('instituteCategory', lang)}</label>
                      <select
                        className="gov-form-input"
                        value={regType}
                        onChange={(e) => setRegType(e.target.value)}
                      >
                        <option value="CENTRAL_STATE_AFFILIATED">Central / State Govt Affiliated</option>
                        <option value="GOVERNMENT_AIDED">Government-Aided Autonomous</option>
                        <option value="DEEMED_UNIVERSITY">Deemed-to-be University</option>
                        <option value="PRIVATE_SELF_FINANCED">Private Self-Financed</option>
                      </select>
                    </div>

                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        {getTranslation('state', lang)} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="gov-form-input"
                        placeholder="e.g. Maharashtra"
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="gov-form-grid-2">
                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        {getTranslation('contactPerson', lang)} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="gov-form-input"
                        placeholder="e.g. Dr. Ramesh Gupta"
                        value={regContactName}
                        onChange={(e) => setRegContactName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        {getTranslation('contactPhone', lang)} <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        className="gov-form-input"
                        placeholder="e.g. +91-9876543210"
                        value={regContactPhone}
                        onChange={(e) => setRegContactPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">
                      {getTranslation('address', lang)} <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="gov-form-input"
                      placeholder="Campus address, city, pincode"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="gov-form-group">
                    <label className="gov-form-label">
                      Official Administrative Portal Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      className="gov-form-input"
                      placeholder="e.g. principal@spit.ac.in"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="gov-form-grid-2">
                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        Password <span className="req">*</span>
                      </label>
                      <input
                        type="password"
                        className="gov-form-input"
                        placeholder="••••••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="gov-form-group">
                      <label className="gov-form-label">
                        Confirm Password <span className="req">*</span>
                      </label>
                      <input
                        type="password"
                        className="gov-form-input"
                        placeholder="••••••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="gov-form-actions">
                    <button
                      type="submit"
                      className="gov-btn gov-btn-primary gov-btn-block"
                      disabled={loading}
                    >
                      {loading ? 'Submitting Application...' : getTranslation('registerSubmitButton', lang)}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <div className="gov-auth-tab-content">
                <div className="gov-auth-header">
                  <h2 className="gov-auth-title">{getTranslation('forgotPasswordTitle', lang)}</h2>
                  <p className="gov-auth-subtitle">
                    Provide your registered official email. Instructions will be dispatched via the secure authentication authority.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="gov-form" noValidate>
                  <div className="gov-form-group">
                    <label className="gov-form-label">
                      Registered Official Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      className="gov-form-input"
                      placeholder="e.g. registrar@institution.edu.in"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="gov-form-actions">
                    <button
                      type="submit"
                      className="gov-btn gov-btn-primary gov-btn-block"
                      disabled={loading}
                    >
                      {loading ? 'Sending Recovery Request...' : getTranslation('forgotPasswordButton', lang)}
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="gov-btn gov-btn-outline"
                      onClick={() => setActiveTab('login')}
                    >
                      Return to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Collapsible Demo Evaluator Drawer (Accessible, but cleanly separated) */}
            <div className="gov-demo-helper-section">
              <button
                type="button"
                className="gov-demo-helper-toggle"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                aria-expanded={showDemoDrawer}
              >
                <span>{getTranslation('demoGuidanceTitle', lang)}</span>
                <span className="gov-toggle-caret">{showDemoDrawer ? '▲' : '▼'}</span>
              </button>

              {showDemoDrawer && (
                <div className="gov-demo-helper-drawer">
                  <p className="gov-demo-helper-intro">
                    {getTranslation('demoQuickFill', lang)}
                  </p>
                  <div className="gov-demo-persona-list">
                    {demoPersonas.map((persona) => (
                      <div
                        key={persona.email}
                        className="gov-demo-persona-item"
                        onClick={() => handlePopulateEmail(persona.email)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handlePopulateEmail(persona.email)}
                        title="Click to populate credentials"
                      >
                        <div className="gov-persona-header">
                          <strong className="gov-persona-label">{persona.label}</strong>
                          <span className="gov-persona-badge">{persona.role}</span>
                        </div>
                        <div className="gov-persona-email mono">{persona.email}</div>
                        <div className="gov-persona-desc">{persona.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Portal Services Action Menu */}
        <aside className="mahadbt-col-right" aria-label="Portal Services Menu">
          <div className="mahadbt-panel action-links-panel">
            <div className="mahadbt-panel-header action-header">
              <h3>{getTranslation('quickLinksTitle', lang)}</h3>
            </div>
            <div className="mahadbt-action-menu">
              <button
                type="button"
                className="mahadbt-action-btn register-action"
                onClick={() => setActiveTab('register')}
              >
                <span className="action-btn-icon">📝</span>
                <span className="action-btn-label">{getTranslation('newRegistration', lang)}</span>
              </button>
              <button
                type="button"
                className="mahadbt-action-btn login-action"
                onClick={() => setActiveTab('login')}
              >
                <span className="action-btn-icon">🔐</span>
                <span className="action-btn-label">{getTranslation('applicantLogin', lang)}</span>
              </button>
              <button
                type="button"
                className="mahadbt-action-btn central-action"
                onClick={() => {
                  setActiveTab('login');
                  handlePopulateEmail('aicte_director@aicte-india.org.synthetic');
                }}
              >
                <span className="action-btn-icon">🏛️</span>
                <span className="action-btn-label">{getTranslation('centralLogin', lang)}</span>
              </button>
              <button
                type="button"
                className="mahadbt-action-btn track-action"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('Please sign in with your institution credentials to track verification requests.');
                }}
              >
                <span className="action-btn-icon">🔍</span>
                <span className="action-btn-label">{getTranslation('trackApplication', lang)}</span>
              </button>
            </div>
          </div>

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
                <span className="manual-text">AICTE Ingestion User Manual</span>
              </div>
              <div className="manual-item">
                <span className="pdf-icon">📄</span>
                <span className="manual-text">CSV Data Schema & Guidelines</span>
              </div>
              <div className="manual-item">
                <span className="pdf-icon">📄</span>
                <span className="manual-text">Transfer Clearance SOP</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
