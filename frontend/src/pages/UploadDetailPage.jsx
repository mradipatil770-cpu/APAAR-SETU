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
      <div className="gov-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div className="gov-spinner" aria-hidden="true" />
        <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Retrieving batch validation records...</p>
      </div>
    );
  }

  if (errorMsg || !detail) {
    return (
      <div className="gov-card gov-card-accent-red" style={{ padding: '24px' }}>
        <h3 style={{ color: 'var(--error)', marginBottom: '8px' }}>Batch Not Found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{errorMsg || 'Upload batch record was not found.'}</p>
        <button className="gov-btn gov-btn-secondary gov-btn-sm" style={{ marginTop: '16px' }} onClick={onBack}>
          ← Back to Overview
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
    <div className="gov-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={onBack}>
          ← Back to Overview
        </button>
        <span className="gov-chip gov-chip-neutral mono">Batch: {detail.id}</span>
      </div>

      {/* Batch Overview Header Card */}
      <div className="gov-card" style={{ marginBottom: '20px' }}>
        <div className="gov-card-header">
          <div>
            <h2 className="gov-card-title" style={{ fontSize: '1.25rem' }}>
              Validation Findings: {detail.filename}
            </h2>
            <p className="gov-card-subtitle">
              Processed: {new Date(detail.created_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className="gov-chip gov-chip-success">{detail.status}</span>
        </div>

        <div className="gov-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '16px' }}>
          <div className="gov-stat-tile">
            <div className="gov-stat-label">Total Rows</div>
            <div className="gov-stat-number">{detail.total_rows}</div>
          </div>
          <div className="gov-stat-tile">
            <div className="gov-stat-label" style={{ color: 'var(--tricolor-green)' }}>Accepted</div>
            <div className="gov-stat-number" style={{ color: 'var(--tricolor-green)' }}>{detail.accepted_rows}</div>
          </div>
          <div className="gov-stat-tile">
            <div className="gov-stat-label" style={{ color: 'var(--error)' }}>Rejected</div>
            <div className="gov-stat-number" style={{ color: 'var(--error)' }}>{detail.rejected_rows}</div>
          </div>
          <div className="gov-stat-tile">
            <div className="gov-stat-label" style={{ color: 'var(--warning)' }}>Total Findings</div>
            <div className="gov-stat-number" style={{ color: 'var(--warning)' }}>{detail.issue_count}</div>
          </div>
        </div>
      </div>

      {/* Issues Table Card */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <h3 className="gov-card-title">Captured Validation Findings ({filteredIssues.length})</h3>
            <p className="gov-card-subtitle">
              Detailed breakdown of row validation outcomes, format checks, and intake discrepancies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'ERROR', 'WARNING'].map((sev) => (
              <button
                key={sev}
                className={`gov-btn gov-btn-sm ${filterSeverity === sev ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev === 'ALL' ? 'All Findings' : sev === 'ERROR' ? 'Errors' : 'Warnings'}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="gov-empty-state">
            <p>No validation issues match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Row #</th>
                  <th>Student Reference</th>
                  <th>APAAR ID</th>
                  <th>Issue Code</th>
                  <th>Severity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{issue.row_number}</td>
                    <td><strong className="mono">{issue.student_ref || '—'}</strong></td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>
                      {issue.apaar_id || '—'}
                    </td>
                    <td>
                      <span className="gov-code-badge">{issue.issue_code}</span>
                    </td>
                    <td>
                      <span className={`gov-chip ${issue.severity === 'ERROR' ? 'gov-chip-error' : 'gov-chip-warning'}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '400px' }}>
                      {issue.explanation}
                    </td>
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
