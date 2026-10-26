import React from 'react';
import { getTranslation } from '../i18n/translations';

export default function GovernmentFooter({ onNavigate, lang = 'en' }) {
  return (
    <footer className="gov-portal-footer" role="contentinfo">
      <div className="gov-footer-inner">
        {/* Useful Quick Links Bar */}
        <div className="gov-footer-links-row">
          <ul className="gov-footer-nav-list">
            <li>
              <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('overview'); }}>
                {getTranslation('footerAbout', lang)}
              </a>
            </li>
            <li className="footer-link-sep">•</li>
            <li>
              <a href="#terms" onClick={(e) => e.preventDefault()}>
                {getTranslation('footerTerms', lang)}
              </a>
            </li>
            <li className="footer-link-sep">•</li>
            <li>
              <a href="#privacy" onClick={(e) => e.preventDefault()}>
                {getTranslation('footerPrivacy', lang)}
              </a>
            </li>
            <li className="footer-link-sep">•</li>
            <li>
              <a href="#hyperlink" onClick={(e) => e.preventDefault()}>
                {getTranslation('footerHyperlink', lang)}
              </a>
            </li>
            <li className="footer-link-sep">•</li>
            <li>
              <a href="#accessibility" onClick={(e) => e.preventDefault()}>
                {getTranslation('footerAccessibility', lang)}
              </a>
            </li>
            <li className="footer-link-sep">•</li>
            <li>
              <a href="#helpdesk" onClick={(e) => e.preventDefault()}>
                {getTranslation('footerContact', lang)}
              </a>
            </li>
          </ul>
        </div>

        {/* Official Governance & Attribution Summary */}
        <div className="gov-footer-editorial-grid">
          <div className="gov-footer-editorial-text">
            <p className="gov-footer-statement">
              {getTranslation('footerManagedBy', lang)}
            </p>
            <p className="gov-footer-hosting">
              {getTranslation('footerHostedBy', lang)}
            </p>
          </div>

          <div className="gov-footer-portals-list">
            <span className="gov-footer-portals-label">{getTranslation('footerUsefulLinks', lang)}:</span>
            <div className="gov-portals-badges">
              <a href="https://www.aicte-india.org" target="_blank" rel="noreferrer" className="gov-portal-badge-link">
                AICTE India ↗
              </a>
              <a href="https://nad.gov.in" target="_blank" rel="noreferrer" className="gov-portal-badge-link">
                NAD ↗
              </a>
              <a href="https://www.abc.gov.in" target="_blank" rel="noreferrer" className="gov-portal-badge-link">
                ABC ↗
              </a>
              <a href="https://www.digilocker.gov.in" target="_blank" rel="noreferrer" className="gov-portal-badge-link">
                DigiLocker ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical & Compliance Metadata Strip */}
      <div className="gov-footer-bottom">
        <div className="gov-footer-bottom-inner">
          <div className="gov-footer-copyright">
            © 2026 {getTranslation('aicteFull', lang)}. {getTranslation('allRightsReserved', lang)}
          </div>
          <div className="gov-footer-meta">
            <span>{getTranslation('lastUpdated', lang)}: 26 October 2026</span>
            <span className="gov-utility-separator">•</span>
            <span>{getTranslation('version', lang)} 2.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
