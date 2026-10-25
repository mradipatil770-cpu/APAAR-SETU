import React from 'react';

export default function OverviewPage({ dashboardData, loading, onSelectUpload, onNavigateUpload }) {
  if (loading) {
    return (
      <div className="gov-card gov-card-accent-top" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving verified institutional metrics from database...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="gov-card gov-card-accent-red" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--error)', fontWeight: 600 }}>Database connection unavailable or unconfigured.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Please verify that the FastAPI backend is operational and connected to Supabase PostgreSQL.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="gov-section-header">
        <div>
          <h2>{dashboardData.institution_name}</h2>
          <p>
            AICTE Permanent ID: <span className="mono" style={{ fontWeight: 700 }}>{dashboardData.institution_id.substring(0, 8)}</span> | State: Delhi NCT | Academic Year: 2026-27
          </p>
        </div>
        <div>
          <button className="gov-btn gov-btn-primary gov-btn-sm" onClick={onNavigateUpload}>
            + Submit Student CSV Batch
          </button>
        </div>
      </div>

      {/* 4 Official Government Metric Tiles */}
      <div className="gov-stats-grid">
        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--gov-blue-accent)' }}>
          <div className="gov-stat-label">Total Records Processed</div>
          <div className="gov-stat-number">{dashboardData.total_processed_records}</div>
          <div className="gov-stat-subtext">Lifetime student rows submitted</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--green-india)' }}>
          <div className="gov-stat-label">Accepted Admissions</div>
          <div className="gov-stat-number" style={{ color: 'var(--green-india)' }}>
            {dashboardData.total_accepted_records}
          </div>
          <div className="gov-stat-subtext">Verified against intake & enrolled</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--error)' }}>
          <div className="gov-stat-label">Rejected / Invalid Rows</div>
          <div className="gov-stat-number" style={{ color: 'var(--error)' }}>
            {dashboardData.total_rejected_records}
          </div>
          <div className="gov-stat-subtext">Format errors or unapproved programmes</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--saffron)' }}>
          <div className="gov-stat-label">Open Anomaly Cases</div>
          <div className="gov-stat-number" style={{ color: 'var(--saffron)' }}>
            {dashboardData.open_anomaly_count}
          </div>
          <div className="gov-stat-subtext">Duplicates & quota warnings for review</div>
        </div>
      </div>

      {/* AICTE Approved Intake Compliance Monitor */}
      <div className="gov-card gov-card-accent-top">
        <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)', marginBottom: '4px' }}>
          AICTE Approved Intake vs. Current Admissions (AY 2026-27)
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Section 10(1)(b) AICTE Act compliance monitor. Admissions exceeding approved quota trigger an administrative review finding.
        </p>

        {dashboardData.programme_stats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No programmes registered for this institution.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {dashboardData.programme_stats.map((prog) => {
              const pct = Math.min(100, Math.round((prog.enrolled_count / prog.approved_intake) * 100));
              return (
                <div key={prog.programme_code} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <strong style={{ color: 'var(--gov-navy)' }}>{prog.programme_code}</strong> — {prog.programme_name} ({prog.academic_year})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {prog.enrolled_count} / {prog.approved_intake} Seats ({pct}%)
                      </span>
                      {prog.is_exceeded ? (
                        <span className="gov-chip gov-chip-error">EXCEEDED QUOTA</span>
                      ) : pct >= 90 ? (
                        <span className="gov-chip gov-chip-warning">NEAR CAPACITY</span>
                      ) : (
                        <span className="gov-chip gov-chip-success">WITHIN QUOTA</span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: prog.is_exceeded ? 'var(--error)' : 'var(--gov-navy)',
                        transition: 'width 0.3s ease',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)' }}>
            Recent Data Upload Batches
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing last 5 ingestion logs</span>
        </div>

        {dashboardData.latest_uploads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            No uploads processed yet. Click "+ Submit Student CSV Batch" to test batch ingestion.
          </div>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Batch Identifier</th>
                  <th>Source File</th>
                  <th>Total Rows</th>
                  <th>Admitted</th>
                  <th>Rejected</th>
                  <th>Issues</th>
                  <th>Status</th>
                  <th>Timestamp (UTC)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.latest_uploads.map((u) => (
                  <tr key={u.id}>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>{u.id.substring(0, 8)}...</td>
                    <td><strong>{u.filename}</strong></td>
                    <td>{u.total_rows}</td>
                    <td style={{ color: 'var(--green-india)', fontWeight: 600 }}>{u.accepted_rows}</td>
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
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="gov-btn gov-btn-secondary gov-btn-sm"
                        onClick={() => onSelectUpload(u.id)}
                      >
                        Inspect Findings
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
