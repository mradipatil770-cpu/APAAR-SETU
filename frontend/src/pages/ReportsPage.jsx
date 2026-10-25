import React, { useState } from 'react';
import { api } from '../services/api';

export default function ReportsPage({ currentUser }) {
  const downloadUrl = api.getReportDownloadUrl();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
    }, 2500);
  };

  return (
    <div className="gov-page">
      <div className="gov-section-header">
        <div>
          <h2 className="gov-section-title">Institutional Compliance Reports</h2>
          <p className="gov-section-subtitle">
            Export institutional student admission summaries, batch processing determinations, and exception audits for official records.
          </p>
        </div>
      </div>

      <div className="gov-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="gov-card-header">
          <div>
            <h3 className="gov-card-title">Compliance Summary Export</h3>
            <p className="gov-card-subtitle">
              Generates a sanitized CSV summary aggregating active batch submission logs, verified enrolments, and anomaly determinations.
            </p>
          </div>
          <span className="gov-chip gov-chip-neutral">Standard CSV</span>
        </div>

        <div className="gov-report-scope-box">
          <div className="gov-report-scope-grid">
            <div>
              <span className="gov-report-scope-label">Institution:</span>
              <span>{currentUser?.institution_name || 'Delhi Institute of Engineering & Technology'}</span>
            </div>
            <div>
              <span className="gov-report-scope-label">AICTE Permanent Code:</span>
              <span className="mono">{currentUser?.institution_id ? 'AICTE-ENG-001' : 'REGULATORY-HQ'}</span>
            </div>
            <div>
              <span className="gov-report-scope-label">Academic Calendar:</span>
              <span>2026–27 Session</span>
            </div>
            <div>
              <span className="gov-report-scope-label">Data Privacy:</span>
              <span>Identifiers Masked (XXXXXXXX9012)</span>
            </div>
          </div>
          <div className="gov-report-security-note">
            All exported spreadsheet cells are sanitized against formula injection. Each export event is permanently attributed in the institutional audit log.
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={downloadUrl}
            className="gov-btn gov-btn-primary"
            style={{ textDecoration: 'none' }}
            download
            onClick={handleDownload}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{downloading ? 'Preparing Report...' : 'Export Compliance Summary (.CSV)'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
