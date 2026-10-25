import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function UploadDetailPage({ uploadId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await api.getUploadDetail(uploadId);
        setDetail(data);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load upload batch details.');
      } finally {
        setLoading(false);
      }
    }
    if (uploadId) loadDetail();
  }, [uploadId]);

  if (loading) {
    return (
      <div className="gov-card gov-card-accent-top" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving batch audit details from database...</p>
      </div>
    );
  }

  if (errorMsg || !detail) {
    return (
      <div className="gov-card gov-card-accent-red" style={{ padding: '24px' }}>
        <p style={{ color: 'var(--error)', fontWeight: 600 }}>{errorMsg || 'Upload batch record not found.'}</p>
        <button className="gov-btn gov-btn-secondary gov-btn-sm" style={{ marginTop: '14px' }} onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const issues = detail.issues || [];
  const filteredIssues = issues.filter((i) => {
    if (filterSeverity === 'ALL') return true;
    return i.severity === filterSeverity;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <span className="gov-chip gov-chip-neutral mono">Batch: {detail.id}</span>
      </div>

      <div className="gov-card gov-card-accent-top" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy)', marginBottom: '4px' }}>
          Batch Validation Audit: {detail.filename}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Processed: {new Date(detail.created_at).toLocaleString()} | Status: <span className="gov-chip gov-chip-success">{detail.status}</span>
        </p>

        <div className="gov-stats-grid" style={{ marginTop: '16px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
            <div className="gov-stat-label">Total Rows</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gov-navy)' }}>{detail.total_rows}</div>
          </div>
          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '12px', borderRadius: '4px' }}>
            <div className="gov-stat-label" style={{ color: 'var(--success)' }}>Accepted</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{detail.accepted_rows}</div>
          </div>
          <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', padding: '12px', borderRadius: '4px' }}>
            <div className="gov-stat-label" style={{ color: 'var(--error)' }}>Rejected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--error)' }}>{detail.rejected_rows}</div>
          </div>
          <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '12px', borderRadius: '4px' }}>
            <div className="gov-stat-label" style={{ color: 'var(--warning)' }}>Total Findings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{detail.issue_count}</div>
          </div>
        </div>
      </div>

      <div className="gov-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)' }}>
            Captured Validation Findings ({filteredIssues.length})
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'ERROR', 'WARNING'].map((sev) => (
              <button
                key={sev}
                className={`gov-btn gov-btn-sm ${filterSeverity === sev ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            No findings recorded matching this filter.
          </p>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Row #</th>
                  <th>Student Reference</th>
                  <th>APAAR ID (Masked)</th>
                  <th>Rule Code</th>
                  <th>Severity</th>
                  <th>Regulatory Explanation</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td><strong>{issue.row_number}</strong></td>
                    <td className="mono">{issue.student_ref || '—'}</td>
                    <td className="mono">{issue.apaar_id || '—'}</td>
                    <td>
                      <code className="mono" style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>
                        {issue.issue_code}
                      </code>
                    </td>
                    <td>
                      <span className={`gov-chip ${issue.severity === 'ERROR' ? 'gov-chip-error' : 'gov-chip-warning'}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>{issue.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
