import React, { useState } from 'react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const demoAccounts = [
    {
      roleName: 'AICTE Central Director',
      badge: 'Central Regulatory Oversight',
      email: 'aicte_director@aicte-india.org.synthetic',
      password: 'demo_password_2026',
      desc: 'National intake tracking, cross-institution duplicate review, and aggregate policy analytics.',
    },
    {
      roleName: 'AICTE Regulatory Analyst',
      badge: 'National Audit & Anomalies',
      email: 'analyst@aicte-india.org.synthetic',
      password: 'demo_password_2026',
      desc: 'National anomaly triage, programme capacity audits, and cross-state reconciliation.',
    },
    {
      roleName: 'Institutional Registrar / Admin',
      badge: 'Delhi Inst. of Eng. & Tech (AICTE-ENG-001)',
      email: 'demo_admin@delhi-tech.edu.synthetic',
      password: 'demo_password_2026',
      desc: 'Student CSV batch upload, APAAR ID format validation, exception resolution, and local verifications.',
    },
  ];

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both official email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.login(email.trim(), password);
      // Persist token and user in localStorage
      localStorage.setItem('apaarsetu_token', response.access_token);
      localStorage.setItem('apaarsetu_user', JSON.stringify(response));

      if (onLoginSuccess) {
        onLoginSuccess(response);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-login-container">
      <div className="gov-login-card">
        {/* Card Header */}
        <div className="gov-login-header">
          <div className="gov-login-emblem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gov-lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="gov-login-title">Secure Portal Sign In</h2>
          <p className="gov-login-subtitle">
            AICTE Regulatory & Institutional Staff Access Management
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="gov-alert-banner error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" className="gov-alert-icon">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Fast-Switch Selector (For Evaluators) */}
        <div className="gov-demo-selector-section">
          <div className="gov-demo-selector-label">
            <svg viewBox="0 0 20 20" fill="currentColor" className="gov-mini-icon">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Hackathon Evaluation Personas (Click to auto-populate):</span>
          </div>
          <div className="gov-demo-accounts-grid">
            {demoAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                className={`gov-demo-account-pill ${email === acc.email ? 'selected' : ''}`}
                onClick={() => handleSelectDemo(acc)}
              >
                <div className="gov-demo-pill-header">
                  <strong>{acc.roleName}</strong>
                  <span className="gov-demo-role-tag">{acc.badge}</span>
                </div>
                <div className="gov-demo-pill-sub">{acc.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="gov-login-form">
          <div className="gov-form-group">
            <label htmlFor="login-email" className="gov-form-label">
              Official Email Address <span className="required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              required
              className="gov-form-input"
              placeholder="e.g. registrar@institution.edu.in or officer@aicte-india.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="gov-form-group">
            <div className="gov-label-row">
              <label htmlFor="login-pass" className="gov-form-label">
                Security Password <span className="required">*</span>
              </label>
              <button
                type="button"
                className="gov-link-subtle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>
            </div>
            <input
              id="login-pass"
              type={showPassword ? 'text' : 'password'}
              required
              className="gov-form-input"
              placeholder="Enter your security password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="gov-form-actions">
            <button
              type="submit"
              className="gov-btn-primary full-width"
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating with Cryptographic Session...</span>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="gov-login-footer">
          <button type="button" className="gov-btn-text" onClick={onCancel}>
            ← Return to Public Home Page
          </button>
        </div>
      </div>
    </div>
  );
}

