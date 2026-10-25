import React from 'react';
import { api } from '../services/api';

export default function ReportsPage() {
  const downloadUrl = api.getReportDownloadUrl();

  return (
    <div>
      <div className="gov-section-header">
        <div>
          <h2>Institutional Regulatory & Audit Reports</h2>
          <p>Export sanitized data uploads, student enrolment statistics, and anomaly determinations for official records.</p>
        </div>
      </div>

      <div className="gov-card gov-card-accent-top" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--gov-navy)', marginBottom: '8px' }}>
          Generate Compliance Summary Export (.CSV)
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
          This export aggregates institutional batch submission logs, verified enrolment totals, and open/resolved
          anomaly cases for the active academic calendar.
        </p>

        <div style={{ background: '#f1f5f9', borderLeft: '4px solid var(--gov-blue-accent)', padding: '14px 18px', borderRadius: '4px', marginBottom: '22px', fontSize: '0.82rem', color: 'var(--text-dark)' }}>
          <strong>🛡️ Cyber Security Compliance Notice (CWE-1236 / OWASP Standards):</strong>
          <p style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
            All exported CSV cells are actively escaped against <em>Spreadsheet Formula Injection</em>. Cells starting with
            formula triggers (<code className="mono">=, +, -, @, tab</code>) are prefixed with a leading apostrophe.
            APAAR identifiers are masked by default to uphold student data privacy guidelines.
          </p>
        </div>

        <a
          href={downloadUrl}
          className="gov-btn gov-btn-primary"
          style={{ textDecoration: 'none' }}
          download
        >
          <span>📥</span>
          <span>Download Sanitized Institutional Audit Report (.CSV)</span>
        </a>
      </div>
    </div>
  );
}
