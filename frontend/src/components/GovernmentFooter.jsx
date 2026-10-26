import React from 'react';
import { getTranslation } from '../i18n/translations';

export default function GovernmentFooter({ onNavigate, lang = 'en' }) {
  return (
    <footer className="gov-official-footer-bar" role="contentinfo">
      <div className="gov-footer-bar-inner">
        {/* Left Navigation Links */}
        <div className="gov-footer-left-links">
          <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('about'); }}>
            {getTranslation('footerAbout', lang)}
          </a>
          <span className="gov-footer-sep" aria-hidden="true">|</span>
          <a href="#terms" onClick={(e) => e.preventDefault()}>
            {getTranslation('footerTerms', lang)}
          </a>
          <span className="gov-footer-sep" aria-hidden="true">|</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>
            {getTranslation('footerPrivacy', lang)}
          </a>
          <span className="gov-footer-sep" aria-hidden="true">|</span>
          <a href="#hyperlink" onClick={(e) => e.preventDefault()}>
            {getTranslation('footerHyperlink', lang)}
          </a>
          <span className="gov-footer-sep" aria-hidden="true">|</span>
          <a href="#accessibility" onClick={(e) => e.preventDefault()}>
            {getTranslation('footerAccessibility', lang)}
          </a>
          <span className="gov-footer-sep" aria-hidden="true">|</span>
          <a href="#helpdesk" onClick={(e) => e.preventDefault()}>
            {getTranslation('footerContact', lang)}
          </a>
        </div>

        {/* Center: Follow us with icons */}
        <div className="gov-footer-center-social">
          <span className="gov-follow-label">{getTranslation('followUs', lang)}</span>
          <div className="gov-social-icons-group">
            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="gov-social-link yt-link"
              title="YouTube"
              aria-label="YouTube"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="gov-social-svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* X (formerly Twitter) */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="gov-social-link x-link"
              title="X (Twitter)"
              aria-label="X (formerly Twitter)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="gov-social-svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="gov-social-link in-link"
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="gov-social-svg">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right: Copyright & Last Updated */}
        <div className="gov-footer-right-copy">
          <div className="gov-copy-text">
            © 2025 APAARSetu. {getTranslation('allRightsReserved', lang)}
          </div>
          <div className="gov-updated-text">
            {getTranslation('lastUpdated', lang)}: {getTranslation('lastUpdatedDate', lang)}
          </div>
        </div>
      </div>
    </footer>
  );
}
