import React from 'react';

export default function GovernmentFooter({ onNavigate }) {
  return (
    <footer className="gov-portal-footer">
      <div className="gov-footer-inner">
        <div className="gov-footer-grid">
          <div className="gov-footer-col">
            <h4 className="gov-footer-heading">APAARSetu Institutional Portal</h4>
            <p className="gov-footer-text">
              Institutional data management and intake compliance system designed for AICTE-affiliated technical
              institutions to validate student admission batches, detect cross-enrolment collisions, and enforce sanctioned quotas.
            </p>
            <div className="gov-footer-dataset-note">
              <strong>Demonstration Environment:</strong> Operating with synthetic institutional records for Delhi Institute of Engineering & Technology (AICTE-ENG-001).
            </div>
          </div>

          <div className="gov-footer-col">
            <h4 className="gov-footer-heading">Portal Navigation</h4>
            <ul className="gov-footer-links">
              <li>
                <button type="button" className="gov-footer-link-btn" onClick={() => onNavigate && onNavigate('overview')}>
                  Overview Dashboard
                </button>
              </li>
              <li>
                <button type="button" className="gov-footer-link-btn" onClick={() => onNavigate && onNavigate('upload')}>
                  Upload Student Data
                </button>
              </li>
              <li>
                <button type="button" className="gov-footer-link-btn" onClick={() => onNavigate && onNavigate('anomalies')}>
                  Review Exceptions
                </button>
              </li>
              <li>
                <button type="button" className="gov-footer-link-btn" onClick={() => onNavigate && onNavigate('reports')}>
                  Compliance Reports
                </button>
              </li>
            </ul>
          </div>

          <div className="gov-footer-col">
            <h4 className="gov-footer-heading">Regulatory Reference Links</h4>
            <ul className="gov-footer-links">
              <li>
                <a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">
                  All India Council for Technical Education (AICTE) ↗
                </a>
              </li>
              <li>
                <a href="https://nad.gov.in" target="_blank" rel="noreferrer">
                  National Academic Depository (NAD) ↗
                </a>
              </li>
              <li>
                <a href="https://www.abc.gov.in" target="_blank" rel="noreferrer">
                  Academic Bank of Credits (ABC) ↗
                </a>
              </li>
              <li>
                <a href="https://www.digilocker.gov.in" target="_blank" rel="noreferrer">
                  DigiLocker Services ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="gov-footer-bottom">
        <div className="gov-footer-bottom-inner">
          <div className="gov-footer-copyright">
            Designed for Institutional Compliance & Intake Reconciliation • Standard Format v1.2
          </div>
          <div className="gov-footer-meta">
            <span>Last Updated: 25 October 2026</span>
            <span className="gov-utility-separator">•</span>
            <span>Version 1.2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
