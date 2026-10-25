import React from 'react';

export default function OverviewPage({ dashboardData, loading, onSelectUpload, onNavigateUpload }) {
  if (loading) {
    return (
      <div className="gov-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div className="gov-spinner" aria-hidden="true" />
        <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Loading institutional enrolment metrics...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="gov-card gov-card-accent-red" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--error)', marginBottom: '8px' }}>Service Unavailable</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Unable to retrieve dashboard metrics from the database. Please verify that the backend API service is running.
        </p>
      </div>
    );
  }

  return (
    <div className="gov-page">
      {/* Institutional Header Banner */}
      <div className="gov-section-header">
        <div>
          <h2 className="gov-section-title">{dashboardData.institution_name}</h2>
          <div className="gov-section-meta">
            <span>Permanent ID: <strong className="mono">{dashboardData.institution_id.substring(0, 8)}</strong></span>
            <span className="gov-utility-separator">•</span>
            <span>Region: Delhi NCT</span>
            <span className="gov-utility-separator">•</span>
            <span>Academic Year: 2026–27</span>
          </div>
        </div>
        <div>
          <button className="gov-btn gov-btn-primary" onClick={onNavigateUpload}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Upload Student Data</span>
          </button>
        </div>
      </div>

      {/* 4 Official Government Metric Tiles */}
      <div className="gov-stats-grid">
        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--gov-blue-accent)' }}>
          <div className="gov-stat-label">Total Records Ingested</div>
          <div className="gov-stat-number">{dashboardData.total_processed_records.toLocaleString()}</div>
          <div className="gov-stat-subtext">Lifetime rows evaluated</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--tricolor-green)' }}>
          <div className="gov-stat-label">Enrolled Students (Approved)</div>
          <div className="gov-stat-number" style={{ color: 'var(--tricolor-green)' }}>
            {dashboardData.total_accepted_records.toLocaleString()}
          </div>
          <div className="gov-stat-subtext">Validated & assigned to branch</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--error)' }}>
          <div className="gov-stat-label">Exceptions / Rejected Rows</div>
          <div className="gov-stat-number" style={{ color: 'var(--error)' }}>
            {dashboardData.total_rejected_records.toLocaleString()}
          </div>
          <div className="gov-stat-subtext">Formatting or quota violations</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--tricolor-saffron)' }}>
          <div className="gov-stat-label">Open Anomaly Cases</div>
          <div className="gov-stat-number" style={{ color: 'var(--tricolor-saffron)' }}>
            {dashboardData.open_anomaly_count}
          </div>
          <div className="gov-stat-subtext">Duplicate or quota findings for review</div>
        </div>
      </div>

      {/* AICTE Approved Intake Compliance Monitor */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <h3 className="gov-card-title">Sanctioned Intake Quota Monitor (AY 2026–27)</h3>
            <p className="gov-card-subtitle">
              Evaluation of active branch enrolments against approved institutional capacity under AICTE regulations.
            </p>
          </div>
          {dashboardData.intake_discrepancy_count > 0 && (
            <span className="gov-chip gov-chip-error">
              {dashboardData.intake_discrepancy_count} Branch Quota Exceeded
            </span>
          )}
        </div>

        {dashboardData.programme_stats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>No academic programmes registered for this institution.</p>
        ) : (
          <div className="gov-intake-list">
            {dashboardData.programme_stats.map((prog) => {
              const pct = Math.min(100, Math.round((prog.enrolled_count / prog.approved_intake) * 100));
              return (
                <div key={prog.programme_code} className="gov-intake-row">
                  <div className="gov-intake-row-header">
                    <div>
                      <strong className="gov-intake-code">{prog.programme_code}</strong>
                      <span className="gov-intake-name"> — {prog.programme_name}</span>
                    </div>
                    <div className="gov-intake-status-group">
                      <span className="gov-intake-count">
                        {prog.enrolled_count} / {prog.approved_intake} Seats ({pct}%)
                      </span>
                      {prog.is_exceeded ? (
                        <span className="gov-chip gov-chip-error">QUOTA EXCEEDED</span>
                      ) : pct >= 90 ? (
                        <span className="gov-chip gov-chip-warning">NEAR CAPACITY</span>
                      ) : (
                        <span className="gov-chip gov-chip-success">WITHIN QUOTA</span>
                      )}
                    </div>
                  </div>
                  <div className="gov-progress-bar-bg" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                    <div
                      className="gov-progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: prog.is_exceeded ? 'var(--error)' : pct >= 90 ? 'var(--warning)' : 'var(--gov-navy)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Batch Submissions Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <h3 className="gov-card-title">Recent Ingestion Batches</h3>
            <p className="gov-card-subtitle">Log of latest student CSV uploads and processing determinations.</p>
          </div>
          <span className="gov-card-badge">Showing last {dashboardData.latest_uploads.length} batches</span>
        </div>

        {dashboardData.latest_uploads.length === 0 ? (
          <div className="gov-empty-state">
            <p>No uploads processed yet.</p>
            <button className="gov-btn gov-btn-secondary gov-btn-sm" style={{ marginTop: '12px' }} onClick={onNavigateUpload}>
              Upload First Batch
            </button>
          </div>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Source File</th>
                  <th>Total Rows</th>
                  <th>Admitted</th>
                  <th>Rejected</th>
                  <th>Findings</th>
                  <th>Status</th>
                  <th>Processed (UTC)</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.latest_uploads.map((u) => (
                  <tr key={u.id}>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{u.id.substring(0, 8)}...</td>
                    <td><strong style={{ color: 'var(--gov-navy)' }}>{u.filename}</strong></td>
                    <td>{u.total_rows}</td>
                    <td style={{ color: 'var(--tricolor-green)', fontWeight: 600 }}>{u.accepted_rows}</td>
                    <td style={{ color: u.rejected_rows > 0 ? 'var(--error)' : 'inherit', fontWeight: u.rejected_rows > 0 ? 600 : 'normal' }}>
                      {u.rejected_rows}
                    </td>
                    <td>
                      <span className={`gov-chip ${u.issue_count > 0 ? 'gov-chip-warning' : 'gov-chip-neutral'}`}>
                        {u.issue_count} findings
                      </span>
                    </td>
                    <td>
                      <span className="gov-chip gov-chip-success">{u.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="gov-btn gov-btn-secondary gov-btn-sm"
                        onClick={() => onSelectUpload(u.id)}
                      >
                        View Details
                      </button>
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
