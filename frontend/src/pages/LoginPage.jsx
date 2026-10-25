import React, { useState } from 'react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, onCancel }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'provisioning'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  // Seeded testing personas for local development inspection
  const demoPersonas = [
    {
      label: 'AICTE Central Director',
      role: 'AICTE_ADMIN',
      email: 'aicte_director@aicte-india.org.synthetic',
      description: 'National regulatory oversight, all-institutions directory, and national quota tracking.',
    },
    {
      label: 'AICTE Regulatory Analyst',
      role: 'AICTE_ANALYST',
      email: 'analyst@aicte-india.org.synthetic',
      description: 'National anomaly triage and cross-institution duplicate candidate review.',
    },
    {
      label: 'Institutional Registrar / Admin',
      role: 'INSTITUTE_ADMIN',
      email: 'demo_admin@delhi-tech.edu.synthetic',
      description: 'Delhi Inst. of Eng. & Tech (AICTE-ENG-001) student batch upload, exception review, and local verifications.',
    },
  ];

  const handlePopulateEmail = (demoEmail) => {
    setEmail(demoEmail);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
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
      // Security: Do not reveal specific user existence details
      setErrorMessage(err.message || 'Invalid credentials or unauthorized account. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-auth-container">
      <div className="gov-auth-card">
        {/* Navigation between Login and Provisioning */}
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
            Portal Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'provisioning'}
            className={`gov-auth-tab ${activeTab === 'provisioning' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('provisioning');
              setErrorMessage(null);
            }}
          >
            Institutional Account Provisioning
          </button>
        </div>

        {activeTab === 'login' && (
          <div className="gov-auth-tab-content">
            <div className="gov-auth-header">
              <h2 className="gov-auth-title">Authorized Portal Sign In</h2>
              <p className="gov-auth-subtitle">
                Institutional and regulatory staff credentials authentication.
              </p>
            </div>

            {errorMessage && (
              <div className="gov-alert-banner error" role="alert" aria-live="assertive">
                <svg viewBox="0 0 20 20" fill="currentColor" className="gov-alert-icon" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="gov-form" noValidate>
              <div className="gov-form-group">
                <label htmlFor="login-email" className="gov-form-label">
                  Official Email Address <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="gov-form-input"
                  placeholder="e.g. registrar@institution.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div className="gov-form-group">
                <div className="gov-label-row">
                  <label htmlFor="login-password" className="gov-form-label">
                    Security Password <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    className="gov-link-subtle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="gov-form-input"
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <div className="gov-form-actions">
                <button
                  type="submit"
                  className="gov-btn gov-btn-primary full-width"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <span>Sign In to Portal</span>
                  )}
                </button>
              </div>
            </form>

            {/* Unobtrusive Secondary Demo Credentials Guidance */}
            <div className="gov-auth-secondary-section">
              <button
                type="button"
                className="gov-auth-toggle-link"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                aria-expanded={showDemoDrawer}
              >
                <span>Local Demonstration Accounts & Roles</span>
                <span className="gov-toggle-caret">{showDemoDrawer ? '▲' : '▼'}</span>
              </button>

              {showDemoDrawer && (
                <div className="gov-demo-drawer">
                  <p className="gov-demo-drawer-intro">
                    Preconfigured demonstration personas for local testing:
                  </p>
                  <div className="gov-demo-list">
                    {demoPersonas.map((persona, idx) => (
                      <div key={idx} className="gov-demo-item">
                        <div className="gov-demo-item-header">
                          <strong>{persona.label}</strong>
                          <span className="gov-demo-badge">{persona.role}</span>
                        </div>
                        <div className="gov-demo-item-email">
                          <code>{persona.email}</code>
                          <button
                            type="button"
                            className="gov-btn-inline-apply"
                            onClick={() => handlePopulateEmail(persona.email)}
                            title="Fill email input"
                          >
                            Use Email
                          </button>
                        </div>
                        <p className="gov-demo-item-desc">{persona.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="gov-demo-note">
                    Standard testing password configured in local test suite: <code>demo_password_2026</code>.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Institutional Account Provisioning Tab */}
        {activeTab === 'provisioning' && (
          <div className="gov-auth-tab-content">
            <div className="gov-auth-header">
              <h2 className="gov-auth-title">Institutional Account Provisioning</h2>
              <p className="gov-auth-subtitle">
                Access governance and administrative onboarding protocol.
              </p>
            </div>

            <div className="gov-provisioning-info">
              <div className="gov-info-callout">
                <h3 className="gov-callout-heading">Institutional Affiliation Verification</h3>
                <p>
                  To maintain strict multi-tenant isolation and safeguard student data, self-service public
                  registration is not permitted. All institutional accounts are provisioned and verified through
                  the appointed Nodal Officer at each approved technical institution.
                </p>
              </div>

              <div className="gov-provisioning-steps">
                <h4 className="gov-steps-heading">Standard Provisioning Protocol:</h4>
                <ol className="gov-numbered-steps">
                  <li>
                    <strong>Official Designation:</strong> The institution's Head of Institution (Director/Principal)
                    designates an authorized Registrar or Nodal Officer for data reporting.
                  </li>
                  <li>
                    <strong>Approval & Credential Dispatch:</strong> Following regulatory verification, secure
                    credentials are electronically issued to the registered institutional domain email.
                  </li>
                  <li>
                    <strong>Account Activation:</strong> The designated administrator signs in and establishes
                    institutional parameters prior to submitting student enrolment batches.
                  </li>
                </ol>
              </div>

              <div className="gov-form-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-outline full-width"
                  onClick={() => setActiveTab('login')}
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="gov-auth-footer">
          <button
            type="button"
            className="gov-btn-back-link"
            onClick={onCancel}
          >
            ← Return to Public Information Page
          </button>
        </div>
      </div>
    </div>
  );
}
