import React from 'react';

export default function LandingPage({ onGoLogin, onExploreServices }) {
  return (
    <div className="portal-landing-page">
      {/* 1. Compact Two-Column Institutional Introduction */}
      <section className="portal-intro-section" aria-labelledby="intro-heading">
        <div className="portal-intro-grid">
          <div className="portal-intro-primary">
            <div className="portal-kicker-strip">
              <span>Technical Institutions Enrolment & Compliance Framework</span>
            </div>

            <h2 id="intro-heading" className="portal-intro-title">
              APAAR ID-Based Student Data Management and Verification
            </h2>

            <p className="portal-intro-text">
              APAARSetu provides technical institutions and regulatory bodies with a secure,
              structured platform to submit student admission records, validate APAAR ID
              structural formatting, monitor approved intake quotas, detect cross-registration
              anomalies, and process authorized academic verification requests.
            </p>

            <div className="portal-intro-actions">
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                onClick={onGoLogin}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-svg" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Institutional & Central Portal Login</span>
              </button>
            </div>
          </div>

          <aside className="portal-intro-aside" aria-label="Portal Access Information">
            <div className="portal-access-card">
              <h3 className="portal-access-heading">Access & Operational Status</h3>
              <ul className="portal-access-list">
                <li>
                  <strong>Active Academic Cycle:</strong>
                  <span>Session 2026–27 Reconciliation</span>
                </li>
                <li>
                  <strong>Authorized Users:</strong>
                  <span>Approved Technical Institutions & Central Regulatory Officers</span>
                </li>
                <li>
                  <strong>Ingestion Protocol:</strong>
                  <span>Deterministic Batch CSV Ingestion with Column-Level Encryption</span>
                </li>
                <li>
                  <strong>Verification Architecture:</strong>
                  <span>Controlled, Consent-Referenced Academic Validation</span>
                </li>
              </ul>
              <div className="portal-access-footer">
                <span className="portal-note-text">
                  Accounts are provisioned through institutional nodal authorities.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* 2. Core Functional Capabilities (Corresponding strictly to working implementations) */}
      <section className="portal-capabilities-section" aria-labelledby="capabilities-heading">
        <div className="portal-section-header">
          <h2 id="capabilities-heading" className="portal-section-title">
            Core System Capabilities
          </h2>
          <p className="portal-section-desc">
            Functional components currently implemented and operational within the APAARSetu platform.
          </p>
        </div>

        <div className="portal-capabilities-grid">
          {/* Capability 1 */}
          <article className="portal-capability-card">
            <div className="portal-card-header">
              <div className="portal-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="portal-card-title">Batch Ingestion & Validation</h3>
            </div>
            <p className="portal-card-body">
              Institutions submit student enrolment datasets via structured CSV format. The ingestion engine
              validates mandatory headers, enforces the 12-digit numeric APAAR ID pattern, and calculates
              SHA-256 file hashes to prevent redundant or corrupted submissions.
            </p>
          </article>

          {/* Capability 2 */}
          <article className="portal-capability-card">
            <div className="portal-card-header">
              <div className="portal-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="portal-card-title">Sanctioned Intake Reconciliation</h3>
            </div>
            <p className="portal-card-body">
              Every admitted student batch is evaluated against approved annual intake limits by discipline
              and academic year. Programmes exceeding approved quotas are flagged with detailed discrepancy
              breakdowns for institutional administrative correction.
            </p>
          </article>

          {/* Capability 3 */}
          <article className="portal-capability-card">
            <div className="portal-card-header">
              <div className="portal-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 className="portal-card-title">Zero-Knowledge Duplicate Detection</h3>
            </div>
            <p className="portal-card-body">
              Candidate detection identifies potential dual-enrolment collisions across multiple institutions
              using deterministic HMAC-SHA-256 blind indexing. Discrepancies are surfaced for administrative review
              without transmitting or exposing plaintext identifiers.
            </p>
          </article>

          {/* Capability 4 */}
          <article className="portal-capability-card">
            <div className="portal-card-header">
              <div className="portal-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="portal-card-title">Controlled Academic Verification</h3>
            </div>
            <p className="portal-card-body">
              Provides an authorized workflow for third-party entities (scholarship councils, background verification
              agencies) to request student enrolment status with verified consent documentation, enabling institutional
              registrars to confirm or reject requests.
            </p>
          </article>

          {/* Capability 5 */}
          <article className="portal-capability-card">
            <div className="portal-card-header">
              <div className="portal-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="portal-card-title">Multi-Tenant Cryptographic Vaulting</h3>
            </div>
            <p className="portal-card-body">
              All stored student identifiers are protected at rest using AES-256-GCM authenticated encryption
              with unique nonces and institutional Associated Authenticated Data (AAD), backed by strict
              database row-level tenant isolation.
            </p>
          </article>

          {/* Capability 6 */}
          <article className="portal-capability-card">
            <div className="portal-card-header">
              <div className="portal-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="portal-card-title">Audited Compliance Export</h3>
            </div>
            <p className="portal-card-body">
              Generates downloadable CSV compliance audits with hardened formula injection defenses (CWE-1236),
              providing timestamped reconciliation summaries of accepted rows, rejected records, and resolved exceptions.
            </p>
          </article>
        </div>
      </section>

      {/* 3. Operational Workflow */}
      <section className="portal-workflow-section" aria-labelledby="workflow-heading">
        <div className="portal-section-header">
          <h2 id="workflow-heading" className="portal-section-title">
            Operational Submission Workflow
          </h2>
          <p className="portal-section-desc">
            Standard four-stage protocol for institutional batch submission and reconciliation.
          </p>
        </div>

        <div className="portal-workflow-steps">
          <div className="portal-step-item">
            <div className="portal-step-number" aria-hidden="true">01</div>
            <div className="portal-step-content">
              <h3 className="portal-step-title">Batch Data Ingestion</h3>
              <p className="portal-step-desc">
                Institutional registrar uploads admitted student records with APAAR ID, discipline code, and admission category.
              </p>
            </div>
          </div>

          <div className="portal-step-item">
            <div className="portal-step-number" aria-hidden="true">02</div>
            <div className="portal-step-content">
              <h3 className="portal-step-title">Automated Validation</h3>
              <p className="portal-step-desc">
                Engine evaluates 12-digit format conformity, required columns, and approved programme existence.
              </p>
            </div>
          </div>

          <div className="portal-step-item">
            <div className="portal-step-number" aria-hidden="true">03</div>
            <div className="portal-step-content">
              <h3 className="portal-step-title">Quota & Collision Scan</h3>
              <p className="portal-step-desc">
                Reconciles enrolled headcount against sanctioned annual intake and executes blind index candidate matching.
              </p>
            </div>
          </div>

          <div className="portal-step-item">
            <div className="portal-step-number" aria-hidden="true">04</div>
            <div className="portal-step-content">
              <h3 className="portal-step-title">Exception Resolution</h3>
              <p className="portal-step-desc">
                Institutional staff review flagged discrepancies in the anomaly queue and log formal audit resolutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Institutional Guidance & Support Information */}
      <section className="portal-guidance-section" aria-labelledby="guidance-heading">
        <div className="portal-guidance-grid">
          <div className="portal-guidance-card">
            <h3 id="guidance-heading" className="portal-guidance-title">Guidance for Technical Institutions</h3>
            <p className="portal-guidance-text">
              Institutional staff must submit student enrolment batches within the prescribed academic reconciliation
              window. Prior to uploading, ensure that academic programmes and sanctioned intake limits for Session 2026–27
              have been reviewed and aligned with regulatory approvals.
            </p>
            <p className="portal-guidance-text">
              For account access or credential updates, contact the appointed institutional Nodal Officer.
            </p>
          </div>

          <div className="portal-guidance-card">
            <h3 className="portal-guidance-title">Academic Verification Services</h3>
            <p className="portal-guidance-text">
              Authorized requesting agencies seeking academic verification must provide student consent reference
              documentation with each inquiry. Requests are queued directly to the target institution's verification ledger
              for registrar determination.
            </p>
            <div className="portal-guidance-btn-wrap">
              <button
                type="button"
                className="gov-btn gov-btn-outline"
                onClick={onGoLogin}
              >
                Access Verification Portal
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
