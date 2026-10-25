import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function CentralAicteDashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'directory' | 'duplicates' | 'verifications'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [intakeSummary, setIntakeSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchCentralData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [statsRes, instsRes, dupsRes, verifsRes, intakeRes] = await Promise.allSettled([
        api.getCentralDashboard(),
        api.getCentralInstitutions(),
        api.getCentralDuplicates(),
        api.getVerifications(),
        api.getCentralIntakeSummary('2026-27'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (instsRes.status === 'fulfilled') setInstitutions(instsRes.value || []);
      if (dupsRes.status === 'fulfilled') setDuplicates(dupsRes.value || []);
      if (verifsRes.status === 'fulfilled') setVerifications(verifsRes.value || []);
      if (intakeRes.status === 'fulfilled') setIntakeSummary(intakeRes.value || []);

      if (
        statsRes.status === 'rejected' &&
        instsRes.status === 'rejected' &&
        dupsRes.status === 'rejected'
      ) {
        setErrorMsg('Unable to retrieve central metrics. Please verify network connectivity.');
      }
    } catch (err) {
      setErrorMsg('Failed to synchronize central regulatory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentralData();
  }, []);

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSanctioned = stats?.total_approved_intake ?? 0;
  const totalEnrolled = stats?.total_accepted_records ?? stats?.total_processed_records ?? 0;
  const utilizationPct = stats?.national_utilization_pct != null
    ? Math.round(stats.national_utilization_pct)
    : (totalSanctioned > 0 ? Math.round((totalEnrolled / totalSanctioned) * 100) : 0);

  return (
    <div className="central-workspace">
      {/* 1. Central Header */}
      <div className="gov-section-header central-header">
        <div>
          <div className="gov-header-tagline">
            <span>Central Regulatory Oversight Authority</span>
            <span className="gov-utility-separator">•</span>
            <span>Academic Session 2026–27</span>
          </div>
          <h2 className="gov-section-title">National Academic Oversight & Intake Monitoring</h2>
          <div className="gov-section-meta">
            <span>Logged in as: <strong>{user?.email}</strong></span>
            <span className="gov-utility-separator">•</span>
            <span>Role: <strong className="mono">{user?.role || 'AICTE_ADMIN'}</strong></span>
          </div>
        </div>
        <div className="gov-header-action-group">
          <button
            type="button"
            className="gov-btn gov-btn-outline"
            onClick={fetchCentralData}
            title="Refresh data from central database"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-svg" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="gov-btn gov-btn-signout"
            onClick={onSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="gov-alert-banner error" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" className="gov-alert-icon" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Executive Metric Tiles */}
      <div className="gov-stats-grid">
        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--gov-navy)' }}>
          <div className="gov-stat-label">Registered Institutions</div>
          <div className="gov-stat-number">{stats?.total_institutions ?? institutions.length}</div>
          <div className="gov-stat-subtext">Active in central directory</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--gov-blue-accent)' }}>
          <div className="gov-stat-label">Approved Annual Intake</div>
          <div className="gov-stat-number">{totalSanctioned.toLocaleString()}</div>
          <div className="gov-stat-subtext">Sanctioned seats across programmes</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--tricolor-green)' }}>
          <div className="gov-stat-label">Validated Student Enrolments</div>
          <div className="gov-stat-number" style={{ color: 'var(--tricolor-green)' }}>
            {totalEnrolled.toLocaleString()}
          </div>
          <div className="gov-stat-subtext">Processed & accepted admissions</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--tricolor-saffron)' }}>
          <div className="gov-stat-label">Cross-Institution Candidates</div>
          <div className="gov-stat-number" style={{ color: 'var(--tricolor-saffron)' }}>
            {stats?.total_cross_institution_duplicates ?? duplicates.length}
          </div>
          <div className="gov-stat-subtext">Blind index collision flags</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="gov-stat-label">Active Verification Inquiries</div>
          <div className="gov-stat-number" style={{ color: '#6366f1' }}>
            {verifications.length}
          </div>
          <div className="gov-stat-subtext">External stakeholder requests</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="gov-tabs-bar" role="tablist" aria-label="Central Dashboard Views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`gov-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          National Overview & Quotas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'directory'}
          className={`gov-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          Institutions Directory ({institutions.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'duplicates'}
          className={`gov-tab-btn ${activeTab === 'duplicates' ? 'active' : ''}`}
          onClick={() => setActiveTab('duplicates')}
        >
          Cross-Institution Candidates ({duplicates.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'verifications'}
          className={`gov-tab-btn ${activeTab === 'verifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('verifications')}
        >
          Verification Oversight ({verifications.length})
        </button>
      </div>

      {/* 4. Tab Panels */}
      {loading ? (
        <div className="gov-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="gov-spinner" aria-hidden="true" />
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
            Loading central regulatory metrics from database...
          </p>
        </div>
      ) : (
        <div className="gov-tab-panel">
          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="gov-panel-column">
              {/* Capacity Allocation Meter */}
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">National Intake Capacity Allocation</h3>
                    <p className="gov-card-subtitle">
                      Cumulative student admissions confirmed against aggregate approved capacity.
                    </p>
                  </div>
                  <span className="gov-chip gov-chip-neutral">{utilizationPct}% Allocated</span>
                </div>
                <div className="gov-card-body">
                  <div className="gov-progress-bar-container large">
                    <div
                      className="gov-progress-bar-fill"
                      style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      role="progressbar"
                      aria-valuenow={utilizationPct}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                  <div className="gov-progress-meta-row">
                    <span>Enrolled Headcount: <strong>{totalEnrolled.toLocaleString()}</strong></span>
                    <span>Approved Capacity: <strong>{totalSanctioned.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Programme Breakdown Table */}
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">Discipline Quota Distribution</h3>
                    <p className="gov-card-subtitle">
                      Breakdown of sanctioned capacity across academic programmes.
                    </p>
                  </div>
                </div>
                <div className="gov-card-body">
                  {intakeSummary.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>
                      No discipline quota summaries currently returned by the database.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Discipline Code</th>
                            <th>Programme Name</th>
                            <th>Sanctioned Capacity</th>
                            <th>Admitted Headcount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {intakeSummary.map((prog, i) => (
                            <tr key={i}>
                              <td><code>{prog.programme_code || prog.code}</code></td>
                              <td>{prog.programme_name || prog.name}</td>
                              <td>{prog.approved_intake ?? '—'}</td>
                              <td>{prog.actual_enrolment ?? '—'}</td>
                              <td>
                                <span className="gov-chip gov-chip-success">Recorded</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Controls Disclosure */}
              <div className="gov-card">
                <div className="gov-card-header">
                  <h3 className="gov-card-title">Data Protection & Cryptographic Architecture</h3>
                </div>
                <div className="gov-card-body">
                  <div className="gov-security-grid">
                    <div className="gov-sec-block">
                      <h4>Deterministic Blind Indexing</h4>
                      <p>
                        Candidate detection uses HMAC-SHA-256 tokens derived from unique salts, enabling
                        cross-institution collision detection without storing or comparing plaintext identifiers.
                      </p>
                    </div>
                    <div className="gov-sec-block">
                      <h4>AES-256-GCM Column Vaulting</h4>
                      <p>
                        Stored student master records are encrypted with unique random nonces and authenticated
                        data bounds, mitigating data exposure risks.
                      </p>
                    </div>
                    <div className="gov-sec-block">
                      <h4>Multi-Tenant Row-Level Security</h4>
                      <p>
                        Relational constraints enforce strict tenant boundaries so institutional staff cannot
                        query other institutions' student-level records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Institutions Directory */}
          {activeTab === 'directory' && (
            <div className="gov-panel-column">
              <div className="gov-filter-bar">
                <input
                  type="text"
                  className="gov-search-input"
                  placeholder="Filter institutions by name or code (e.g. AICTE-ENG-001)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Filter institutions"
                />
                <span className="gov-filter-count">
                  {filteredInstitutions.length} {filteredInstitutions.length === 1 ? 'institution' : 'institutions'} listed
                </span>
              </div>

              <div className="gov-card table-card">
                {filteredInstitutions.length === 0 ? (
                  <div className="gov-empty-state">
                    <p>No institutions match the filter criteria.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>Institution Code</th>
                          <th>Institution Name</th>
                          <th>Approved Intake</th>
                          <th>Total Enrolled</th>
                          <th>Utilization</th>
                          <th>Open Exceptions</th>
                          <th>Audit Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInstitutions.map((inst) => (
                          <tr key={inst.id}>
                            <td><code>{inst.code}</code></td>
                            <td><strong>{inst.name}</strong></td>
                            <td>{inst.approved_intake ?? '—'}</td>
                            <td>{inst.enrolled_count ?? 0}</td>
                            <td>
                              <span className="gov-chip gov-chip-neutral">
                                {inst.utilization_pct != null ? `${Math.round(inst.utilization_pct)}%` : '—'}
                              </span>
                            </td>
                            <td>
                              {inst.open_anomalies > 0 ? (
                                <span className="gov-chip gov-chip-error">{inst.open_anomalies} Open</span>
                              ) : (
                                <span className="gov-chip gov-chip-success">Clean</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="gov-btn-inline-action"
                                onClick={() => setSelectedInst(inst)}
                              >
                                View Dossier
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Institution Dossier Modal */}
              {selectedInst && (
                <div className="gov-modal-backdrop" onClick={() => setSelectedInst(null)}>
                  <div
                    className="gov-modal"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dossier-heading"
                  >
                    <div className="gov-modal-header">
                      <h3 id="dossier-heading">Institution Dossier: {selectedInst.code}</h3>
                      <button
                        type="button"
                        className="gov-modal-close"
                        onClick={() => setSelectedInst(null)}
                        aria-label="Close modal"
                      >
                        ×
                      </button>
                    </div>
                    <div className="gov-modal-body">
                      <div className="gov-dossier-field">
                        <span className="gov-dossier-label">Official Name:</span>
                        <span className="gov-dossier-value">{selectedInst.name}</span>
                      </div>
                      <div className="gov-dossier-field">
                        <span className="gov-dossier-label">System UUID:</span>
                        <code className="gov-dossier-value">{selectedInst.id}</code>
                      </div>
                      <div className="gov-dossier-field">
                        <span className="gov-dossier-label">Sanctioned Intake Quota:</span>
                        <span className="gov-dossier-value">{selectedInst.approved_intake ?? '—'} seats</span>
                      </div>
                      <div className="gov-dossier-field">
                        <span className="gov-dossier-label">Active Enrolled Count:</span>
                        <span className="gov-dossier-value">{selectedInst.enrolled_count ?? 0} students</span>
                      </div>
                      <div className="gov-dossier-field">
                        <span className="gov-dossier-label">Open Anomaly Cases:</span>
                        <span className="gov-dossier-value">{selectedInst.open_anomalies ?? 0} cases</span>
                      </div>
                    </div>
                    <div className="gov-modal-footer">
                      <button
                        type="button"
                        className="gov-btn gov-btn-primary"
                        onClick={() => setSelectedInst(null)}
                      >
                        Close Dossier
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Cross-Institution Duplicate Candidates */}
          {activeTab === 'duplicates' && (
            <div className="gov-panel-column">
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">Cross-Institution Collision Candidates</h3>
                    <p className="gov-card-subtitle">
                      Zero-knowledge candidate flags where identical APAAR ID blind indexes appear across distinct institutions.
                    </p>
                  </div>
                </div>
                <div className="gov-card-body">
                  {duplicates.length === 0 ? (
                    <div className="gov-empty-state">
                      <div className="gov-empty-icon-check" aria-hidden="true">✓</div>
                      <h4>No Cross-Institution Duplicate Candidates Flagged</h4>
                      <p>All reconciled institutional datasets currently show distinct student identity tokens.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Student Ref</th>
                            <th>Masked Token</th>
                            <th>Collision Institutions</th>
                            <th>Candidate Count</th>
                            <th>Academic Years</th>
                            <th>Risk Classification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {duplicates.map((dup, i) => (
                            <tr key={i}>
                              <td>
                                <strong>{(dup.student_refs && dup.student_refs.join(', ')) || '—'}</strong>
                              </td>
                              <td>
                                <code>{dup.masked_apaar || `${dup.apaar_lookup_hash?.slice(0, 12)}...`}</code>
                              </td>
                              <td>{(dup.institutions && dup.institutions.join(', ')) || '—'}</td>
                              <td>{dup.student_count ?? 1}</td>
                              <td>{(dup.academic_years && dup.academic_years.join(', ')) || '2026-27'}</td>
                              <td>
                                <span className={`gov-chip ${dup.risk_level === 'CRITICAL' ? 'gov-chip-error' : 'gov-chip-warning'}`}>
                                  {dup.risk_level || 'REVIEW REQUIRED'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Verification Oversight */}
          {activeTab === 'verifications' && (
            <div className="gov-panel-column">
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">Academic Verification Audit Ledger</h3>
                    <p className="gov-card-subtitle">
                      Audit trail of student verification requests received from external authorized bodies.
                    </p>
                  </div>
                </div>
                <div className="gov-card-body">
                  {verifications.length === 0 ? (
                    <div className="gov-empty-state">
                      <p>No verification requests recorded in the central audit ledger.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Request ID</th>
                            <th>Target Institution</th>
                            <th>Student Ref</th>
                            <th>Requesting Entity</th>
                            <th>Purpose</th>
                            <th>Consent Status</th>
                            <th>Determination</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verifications.map((v) => (
                            <tr key={v.id}>
                              <td><code>{v.id.slice(0, 8)}...</code></td>
                              <td>{v.institution_name || v.institution_id?.slice(0, 8)}</td>
                              <td><strong>{v.student_ref}</strong></td>
                              <td>
                                <div><strong>{v.requester_org}</strong></div>
                                <small style={{ color: 'var(--text-muted)' }}>{v.requester_email}</small>
                              </td>
                              <td>{v.purpose}</td>
                              <td>
                                <span className="gov-chip gov-chip-neutral">
                                  {v.consent_status || 'VERIFIED'}
                                </span>
                              </td>
                              <td>
                                <span className={`gov-chip ${v.status === 'CONFIRMED' || v.status === 'APPROVED' ? 'gov-chip-success' : v.status === 'REJECTED' ? 'gov-chip-error' : 'gov-chip-warning'}`}>
                                  {v.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
