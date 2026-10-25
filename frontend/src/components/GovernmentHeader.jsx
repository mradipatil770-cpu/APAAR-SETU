import React from 'react';

export default function GovernmentHeader() {
  return (
    <header>
      {/* 1. Indian Tricolor Accent Strip */}
      <div className="gov-tricolor-strip" />

      {/* 2. Top Utility & Accessibility Bar */}
      <div className="gov-top-utility">
        <div>
          <span>भारत सरकार | Government of India</span>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
          <span>शिक्षा मंत्रालय | Ministry of Education</span>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
          <span>अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE)</span>
        </div>
        <div className="gov-accessibility-controls">
          <span>A-</span>
          <button className="gov-access-btn" title="Normal Font Size">A</button>
          <span>A+</span>
          <span style={{ margin: '0 4px', color: '#94a3b8' }}>|</span>
          <span style={{ fontWeight: 600 }}>English / हिन्दी</span>
        </div>
      </div>

      {/* 3. Main Government Masthead */}
      <div className="gov-masthead">
        <div className="gov-masthead-inner">
          <div className="gov-emblem-section">
            {/* National Lion Capital Crest representation */}
            <svg
              className="gov-emblem-svg"
              viewBox="0 0 100 100"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              title="Government of India Emblem Representation"
            >
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M50 15 L55 35 L45 35 Z" fill="currentColor" />
              <rect x="35" y="38" width="30" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
              <line x1="42" y1="38" x2="42" y2="62" stroke="currentColor" strokeWidth="2" />
              <line x1="50" y1="38" x2="50" y2="62" stroke="currentColor" strokeWidth="2" />
              <line x1="58" y1="38" x2="58" y2="62" stroke="currentColor" strokeWidth="2" />
              <rect x="25" y="66" width="50" height="8" rx="2" fill="currentColor" />
              <text x="50" y="86" fontSize="9" fontWeight="bold" textAnchor="middle" fill="currentColor">
                सत्यमेव जयते
              </text>
            </svg>

            <div className="gov-title-group">
              <h2>अपर सेतु</h2>
              <h1>APAARSetu</h1>
              <p>AICTE Institutional Student Data Management & Verification Portal</p>
            </div>
          </div>

          <div className="gov-initiatives-badges">
            <div className="gov-badge-pill">
              <div style={{ color: '#0f52ba', fontWeight: 800 }}>ABC</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Academic Bank of Credits</div>
            </div>
            <div className="gov-badge-pill">
              <div style={{ color: '#138808', fontWeight: 800 }}>NAD</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>National Academic Depository</div>
            </div>
            <div className="gov-badge-pill" style={{ borderLeft: '3px solid #ff9933' }}>
              <div style={{ color: '#b45309', fontWeight: 800 }}>AICTE</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Approved Prototype</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

