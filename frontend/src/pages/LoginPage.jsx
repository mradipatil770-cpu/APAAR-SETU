import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../i18n/translations';

export default function LoginPage({ onLoginSuccess, onCancel, lang = 'en', initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'login'); // 'login' | 'register' | 'forgot'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
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
      setErrorMessage(lang === 'hi' ? 'कृपया आपला नोंदणीकृत ईमेल आणि पासवर्ड प्रविष्ट करा.' : 'Please enter both your registered official email and password.');
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
      setErrorMessage(lang === 'hi' ? 'पासवर्ड जुळत नाहीत.' : 'Passwords do not match. Please verify and re-enter.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage(lang === 'hi' ? 'पासवर्ड किमान ६ अक्षरांचा असावा.' : 'Password must be at least 6 characters.');
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
      setErrorMessage(lang === 'hi' ? 'कृपया आपला अधिकृत ईमेल प्रविष्ट करा.' : 'Please provide your official registered email address.');
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
    <div className="gov-login-viewport">
      {/* Central Login Card matching Reference Image 1 Top-Right */}
      <div className="gov-login-card">
        {/* Navigation Tabs between Login / Register / Forgot */}
        <div className="gov-auth-tabs-row" role="tablist">
          <button
            type="button"
            className={`gov-auth-tab-link ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
          >
            {getTranslation('loginTitle', lang)}
          </button>
          <button
            type="button"
            className={`gov-auth-tab-link ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setErrorMessage(null); setSuccessMessage(null); }}
          >
            {getTranslation('navRegister', lang)}
          </button>
          <button
            type="button"
            className={`gov-auth-tab-link ${activeTab === 'forgot' ? 'active' : ''}`}
            onClick={() => { setActiveTab('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
          >
            {getTranslation('forgotPasswordLink', lang)}
          </button>
        </div>

        {/* Global Feedback Banner */}
        {errorMessage && (
          <div className="gov-form-alert error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="gov-form-alert success" role="status">
            <span className="alert-icon">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: INSTITUTION LOGIN (Exact Image 1 Layout) */}
        {activeTab === 'login' && (
          <div className="gov-login-form-container">
            <h1 className="gov-login-title">{getTranslation('loginTitle', lang)}</h1>

            <form onSubmit={handleLoginSubmit} className="gov-simple-form" noValidate>
              {/* Institution Email / AICTE ID */}
              <div className="gov-field-group">
                <label htmlFor="login-email" className="gov-field-label">
                  {getTranslation('officialEmail', lang)} <span className="req-star">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="gov-field-input"
                  placeholder="उदा. principal@college.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="gov-field-group">
                <label htmlFor="login-password" className="gov-field-label">
                  {getTranslation('password', lang)} <span className="req-star">*</span>
                </label>
                <div className="gov-input-eye-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="gov-field-input"
                    placeholder={lang === 'hi' ? 'पासवर्ड प्रविष्ट करा' : 'Enter password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="gov-eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Captcha Security Box (Reference Image 1) */}
              <div className="gov-field-group">
                <label htmlFor="login-captcha" className="gov-field-label">
                  {getTranslation('captchaLabel', lang)} <span className="req-star">*</span>
                </label>
                <div className="gov-captcha-row">
                  <div className="gov-captcha-display" aria-label="Captcha security code">
                    <span className="captcha-text">{captchaCode}</span>
                  </div>
                  <button
                    type="button"
                    className="gov-captcha-refresh-btn"
                    onClick={refreshCaptcha}
                    title={getTranslation('captchaRefresh', lang)}
                  >
                    🔄 {getTranslation('captchaRefresh', lang)}
                  </button>
                </div>
                <input
                  id="login-captcha"
                  type="text"
                  className="gov-field-input captcha-input-box"
                  placeholder={lang === 'hi' ? 'वरील मजकूर प्रविष्ट करा' : 'Enter security text above'}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Primary Action Button: Muted Blue #174A78 / #1769AA */}
              <div className="gov-field-actions">
                <button
                  type="submit"
                  className="gov-btn-submit-primary"
                  disabled={loading}
                >
                  {loading ? getTranslation('loadingText', lang) : getTranslation('loginButton', lang)}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="gov-forgot-link-wrap">
                <button
                  type="button"
                  className="gov-link-button"
                  onClick={() => setActiveTab('forgot')}
                >
                  {getTranslation('forgotPasswordLink', lang)}
                </button>
              </div>

              {/* Privacy & Trust Badge */}
              <div className="gov-login-privacy-footer">
                <span className="privacy-shield-icon">🛡️</span>
                <span className="privacy-note-text">
                  {getTranslation('trustPrivacyNote', lang)}
                </span>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: REGISTER NEW INSTITUTION */}
        {activeTab === 'register' && (
          <div className="gov-login-form-container">
            <h1 className="gov-login-title">{getTranslation('registerTitle', lang)}</h1>
            <p className="gov-login-subtitle">{getTranslation('registerSubtitle', lang)}</p>

            <form onSubmit={handleRegisterSubmit} className="gov-simple-form" noValidate>
              <div className="gov-form-grid-2">
                <div className="gov-field-group">
                  <label className="gov-field-label">
                    {getTranslation('instituteName', lang)} <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="gov-field-input"
                    placeholder="e.g. Sardar Patel Institute of Technology"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>

                <div className="gov-field-group">
                  <label className="gov-field-label">
                    {getTranslation('instituteCode', lang)} <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="gov-field-input"
                    placeholder="e.g. AICTE-WEST-2026-99"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gov-form-grid-2">
                <div className="gov-field-group">
                  <label className="gov-field-label">{getTranslation('instituteCategory', lang)}</label>
                  <select
                    className="gov-field-input"
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                  >
                    <option value="CENTRAL_STATE_AFFILIATED">Central / State Govt Affiliated</option>
                    <option value="GOVERNMENT_AIDED">Government-Aided Autonomous</option>
                    <option value="DEEMED_UNIVERSITY">Deemed-to-be University</option>
                    <option value="PRIVATE_SELF_FINANCED">Private Self-Financed</option>
                  </select>
                </div>

                <div className="gov-field-group">
                  <label className="gov-field-label">
                    {getTranslation('state', lang)} <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="gov-field-input"
                    placeholder="e.g. Maharashtra"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gov-form-grid-2">
                <div className="gov-field-group">
                  <label className="gov-field-label">
                    {getTranslation('contactPerson', lang)} <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="gov-field-input"
                    placeholder="e.g. Dr. Ramesh Gupta"
                    value={regContactName}
                    onChange={(e) => setRegContactName(e.target.value)}
                    required
                  />
                </div>

                <div className="gov-field-group">
                  <label className="gov-field-label">
                    {getTranslation('contactPhone', lang)} <span className="req-star">*</span>
                  </label>
                  <input
                    type="tel"
                    className="gov-field-input"
                    placeholder="e.g. +91-9876543210"
                    value={regContactPhone}
                    onChange={(e) => setRegContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gov-field-group">
                <label className="gov-field-label">
                  {getTranslation('address', lang)} <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="gov-field-input"
                  placeholder="Campus address, city, pincode"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  required
                />
              </div>

              <div className="gov-field-group">
                <label className="gov-field-label">
                  Official Administrative Portal Email <span className="req-star">*</span>
                </label>
                <input
                  type="email"
                  className="gov-field-input"
                  placeholder="e.g. principal@spit.ac.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="gov-form-grid-2">
                <div className="gov-field-group">
                  <label className="gov-field-label">
                    Password <span className="req-star">*</span>
                  </label>
                  <input
                    type="password"
                    className="gov-field-input"
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="gov-field-group">
                  <label className="gov-field-label">
                    Confirm Password <span className="req-star">*</span>
                  </label>
                  <input
                    type="password"
                    className="gov-field-input"
                    placeholder="••••••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gov-field-actions">
                <button
                  type="submit"
                  className="gov-btn-submit-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting Application...' : getTranslation('registerSubmitButton', lang)}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PASSWORD RECOVERY */}
        {activeTab === 'forgot' && (
          <div className="gov-login-form-container">
            <h1 className="gov-login-title">{getTranslation('forgotPasswordTitle', lang)}</h1>
            <p className="gov-login-subtitle">
              Provide your registered official email. Instructions will be dispatched via the secure authentication authority.
            </p>

            <form onSubmit={handleForgotSubmit} className="gov-simple-form" noValidate>
              <div className="gov-field-group">
                <label className="gov-field-label">
                  Registered Official Email <span className="req-star">*</span>
                </label>
                <input
                  type="email"
                  className="gov-field-input"
                  placeholder="e.g. registrar@institution.edu.in"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <div className="gov-field-actions">
                <button
                  type="submit"
                  className="gov-btn-submit-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending Recovery Request...' : getTranslation('forgotPasswordButton', lang)}
                </button>
              </div>

              <div className="gov-forgot-link-wrap">
                <button
                  type="button"
                  className="gov-link-button"
                  onClick={() => setActiveTab('login')}
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collapsible Demo Personas Drawer for Evaluators */}
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
    </div>
  );
}
