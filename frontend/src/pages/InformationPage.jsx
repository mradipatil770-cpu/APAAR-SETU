import React from 'react';
import { getTranslation } from '../i18n/translations';

export default function InformationPage({
  category = 'about',
  subCategory = null,
  onGoHome,
  onGoLogin,
  onGoRegister,
  lang = 'en',
}) {
  return (
    <div className="gov-info-page-container">
      {/* Breadcrumb strip */}
      <nav className="gov-breadcrumb-nav" aria-label="Breadcrumb">
        <div className="gov-breadcrumb-inner">
          <button type="button" className="breadcrumb-link" onClick={onGoHome}>
            {getTranslation('navHome', lang)}
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">
            {category === 'about' && getTranslation('pageAboutTitle', lang)}
            {category === 'workflow' && getTranslation('pageWorkflowTitle', lang)}
            {category === 'stakeholders' && getTranslation('pageStakeholdersTitle', lang)}
            {category === 'help' && getTranslation('pageHelpTitle', lang)}
            {category === 'news' && getTranslation('pageNewsTitle', lang)}
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <div className="gov-info-page-main">
        <div className="gov-info-header-block">
          <h1 className="gov-info-title">
            {category === 'about' && getTranslation('pageAboutTitle', lang)}
            {category === 'workflow' && getTranslation('pageWorkflowTitle', lang)}
            {category === 'stakeholders' && getTranslation('pageStakeholdersTitle', lang)}
            {category === 'help' && getTranslation('pageHelpTitle', lang)}
            {category === 'news' && getTranslation('pageNewsTitle', lang)}
          </h1>
          <p className="gov-info-descriptor">
            {getTranslation('officialPortalDescriptor', lang)}
          </p>
        </div>

        {/* 1. ABOUT US VIEW */}
        {category === 'about' && (
          <div className="gov-info-content-card">
            <section className="gov-info-section">
              <h2 className="section-title">1. {getTranslation('menuAboutPortal', lang)}</h2>
              <p className="section-para">
                APAARSetu is a dedicated technical platform developed to facilitate structured student data management, intake compliance monitoring, and authoritative academic verification for AICTE-approved technical institutions across India.
              </p>
              <p className="section-para">
                Operating under the Automated Permanent Academic Account Registry (APAAR) framework, APAARSetu provides an institutional bridge enabling colleges to validate enrolments, prevent duplicate student identity registrations, and adhere to sanctioned programme limits.
              </p>
            </section>

            <section className="gov-info-section">
              <h2 className="section-title">2. {getTranslation('menuPurposeObjectives', lang)}</h2>
              <ul className="gov-bullet-list">
                <li><strong>100% APAAR Saturation:</strong> Accelerate adoption of 12-digit APAAR IDs across all technical engineering and management students.</li>
                <li><strong>Intake Quota Compliance:</strong> Monitor institutional admissions in real time against approved programme capacities.</li>
                <li><strong>Cross-Institution Reconciliation:</strong> Identify potential duplicate enrolments and facilitate authorized transfer NOCs.</li>
                <li><strong>Data Privacy & Security:</strong> Enforce AES-256-GCM field encryption and HMAC blind indexing for confidential student identifiers.</li>
              </ul>
            </section>

            <section className="gov-info-section">
              <h2 className="section-title">3. {getTranslation('menuScopePlatform', lang)}</h2>
              <p className="section-para">
                The platform serves AICTE-approved technical universities, autonomous engineering colleges, and polytechnic institutes. It provides distinct administrative roles for central regulatory analysts, institution heads, operators, and compliance auditors.
              </p>
            </section>
          </div>
        )}

        {/* 2. WORKFLOW VIEW */}
        {category === 'workflow' && (
          <div className="gov-info-content-card">
            <section className="gov-info-section">
              <h2 className="section-title">1. {getTranslation('menuInstRegistration', lang)}</h2>
              <p className="section-para">
                Technical institutions register by submitting foundational details including AICTE approval code, institutional category, and authorized administrative contact credentials. Central administrators verify eligibility prior to granting upload rights.
              </p>
            </section>

            <section className="gov-info-section">
              <h2 className="section-title">2. {getTranslation('menuDataSubmission', lang)}</h2>
              <p className="section-para">
                Institutions upload student batches via standard CSV format. Mandatory columns include Student Name, 12-Digit APAAR ID, Enrolment Number, Academic Year, and Programme Code. Files are checked client-side for size constraints (maximum 5MB / 10,000 rows).
              </p>
            </section>

            <section className="gov-info-section">
              <h2 className="section-title">3. {getTranslation('menuValidationReview', lang)}</h2>
              <p className="section-para">
                The backend validation pipeline executes automated regex integrity checks, cryptographic hashing, and cross-checks student numbers against sanctioned programme limits.
              </p>
            </section>

            <section className="gov-info-section">
              <h2 className="section-title">4. {getTranslation('menuEnrolmentMonitoring', lang)}</h2>
              <p className="section-para">
                The dashboard tracks approved intake capacity against admitted counts in real time, alerting institutions immediately if admissions exceed regulatory limits.
              </p>
            </section>
          </div>
        )}

        {/* 3. STAKEHOLDERS VIEW */}
        {category === 'stakeholders' && (
          <div className="gov-info-content-card">
            <div className="gov-stakeholder-roles-grid">
              <div className="role-card">
                <div className="role-icon">🏛️</div>
                <h3 className="role-name">{getTranslation('menuStakeholderAicte', lang)}</h3>
                <p className="role-desc">Maintains national regulatory oversight, reviews institution onboarding requests, and monitors nationwide quota compliance.</p>
              </div>

              <div className="role-card">
                <div className="role-icon">🎓</div>
                <h3 className="role-name">{getTranslation('menuStakeholderInstAdmin', lang)}</h3>
                <p className="role-desc">Principals and directors with executive authority over institutional data submissions, student transfers, and compliance reports.</p>
              </div>

              <div className="role-card">
                <div className="role-icon">💻</div>
                <h3 className="role-name">{getTranslation('menuStakeholderOperators', lang)}</h3>
                <p className="role-desc">Campus administrative staff responsible for CSV batch uploads, error review, and student record maintenance.</p>
              </div>

              <div className="role-card">
                <div className="role-icon">📋</div>
                <h3 className="role-name">{getTranslation('menuStakeholderAuditors', lang)}</h3>
                <p className="role-desc">Independent regulatory auditors who inspect immutable audit logs and verify data integrity without modifying records.</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. HELP / FAQ VIEW */}
        {category === 'help' && (
          <div className="gov-info-content-card">
            <section className="gov-info-section">
              <h2 className="section-title">{getTranslation('menuFaq', lang)}</h2>
              <div className="faq-item">
                <h4 className="faq-question">Q: What is the format for APAAR ID submission?</h4>
                <p className="faq-answer">APAAR IDs must be exactly 12 numeric digits without hyphens or spaces (e.g. 123456789012).</p>
              </div>

              <div className="faq-item">
                <h4 className="faq-question">Q: What should an institution do if sanctioned intake is exceeded?</h4>
                <p className="faq-answer">The platform automatically flags excess enrolments as discrepancy anomalies. Institutions must rectify enrolment numbers or apply for approval through the AICTE Central Bureau.</p>
              </div>

              <div className="faq-item">
                <h4 className="faq-question">Q: How is student privacy protected?</h4>
                <p className="faq-answer">Confidential identifiers are encrypted at rest using AES-256-GCM. Fast search is conducted via HMAC-SHA-256 blind indexing so plaintext identifiers are never stored unencrypted.</p>
              </div>
            </section>

            <section className="gov-info-section">
              <h2 className="section-title">{getTranslation('menuContactSupport', lang)}</h2>
              <p className="section-para">
                For administrative assistance, technical queries, or institutional onboarding support, participating institutions may contact the technical desk through the portal support channel.
              </p>
            </section>
          </div>
        )}

        {/* 5. LATEST NEWS VIEW */}
        {category === 'news' && (
          <div className="gov-info-content-card">
            <section className="gov-info-section">
              <h2 className="section-title">{getTranslation('latestNewsHeading', lang)}</h2>
              <div className="gov-empty-notice-state" role="status">
                <div className="empty-state-icon" aria-hidden="true">📢</div>
                <p className="empty-state-text">
                  {getTranslation('emptyStateLatestNews', lang)}
                </p>
                <span className="empty-state-subtext">
                  Official circulars, notifications, and press releases will be displayed here as they are published by the administration.
                </span>
              </div>
            </section>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="gov-info-bottom-actions">
          <button type="button" className="gov-btn-secondary" onClick={onGoHome}>
            {getTranslation('backToHome', lang)}
          </button>
          <button type="button" className="gov-btn-primary" onClick={onGoRegister}>
            {getTranslation('btnRegisterInst', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

