import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../i18n/translations';

export default function CentralAicteDashboard({ user, onSignOut, lang = 'en' }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'directory' | 'pending' | 'duplicates' | 'transfers' | 'verifications'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [pendingInstitutions, setPendingInstitutions] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [intakeSummary, setIntakeSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === 'AICTE_ADMIN';

  // Lazy-load data based on active tab to eliminate connection pool starvation
  const fetchTabData = async (tabToFetch, force = false) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tabToFetch === 'overview') {
        const [statsRes, intakeRes] = await Promise.allSettled([
          api.getCentralDashboard(),
          api.getCentralIntakeSummary('2026-27'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (intakeRes.status === 'fulfilled') setIntakeSummary(intakeRes.value || []);
      } else if (tabToFetch === 'directory') {
        if (institutions.length === 0 || force) {
          const res = await api.getCentralInstitutions();
          setInstitutions(res || []);
        }
      } else if (tabToFetch === 'pending') {
        if (pendingInstitutions.length === 0 || force) {
          const res = await api.getPendingInstitutions();
          setPendingInstitutions(res || []);
        }
      } else if (tabToFetch === 'duplicates') {
        if (duplicates.length === 0 || force) {
          const res = await api.getCentralDuplicates();
          setDuplicates(res || []);
        }
      } else if (tabToFetch === 'transfers') {
        if (transfers.length === 0 || force) {
          const res = await api.getCentralTransfers();
          setTransfers(res || []);
        }
      } else if (tabToFetch === 'verifications') {
        if (verifications.length === 0 || force) {
          const res = await api.getVerifications();
          setVerifications(res || []);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve data for the active view.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: Fetch overview metrics
  useEffect(() => {
    fetchTabData('overview');
  }, []);

  // On tab change: Load tab-specific data on-demand
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleManualRefresh = () => {
    fetchTabData(activeTab, true);
  };

  const handleDecideInstitution = async (institutionId, newStatus, remarks) => {
    if (!isAdmin) {
      setErrorMsg('Unauthorized: Only AICTE Central Director (AICTE_ADMIN) can approve or reject institutions.');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.decideInstitutionOnboarding(institutionId, newStatus, remarks);
      setSuccessMsg(`Institution status successfully updated to ${newStatus}.`);
      handleManualRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update institution status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecideTransfer = async (transferId, newStatus, remarks) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.decideCentralTransfer(transferId, newStatus, remarks);
      setSuccessMsg(`Transfer request updated to ${newStatus}.`);
      handleManualRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update transfer status.');
    } finally {
      setActionLoading(false);
    }
  };

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
            onClick={handleManualRefresh}
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

      {successMsg && (
        <div className="gov-alert-banner success" style={{ marginBottom: '16px' }}>
          <span>{successMsg}</span>
        </div>
      )}

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
          <div className="gov-stat-label">Active Institutions</div>
          <div className="gov-stat-number">{stats?.total_institutions ?? institutions.length}</div>
          <div className="gov-stat-subtext">Approved technical institutes</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid #ea580c' }}>
          <div className="gov-stat-label">Pending Verifications</div>
          <div className="gov-stat-number" style={{ color: '#ea580c' }}>{pendingInstitutions.length}</div>
          <div className="gov-stat-subtext">Awaiting regulatory approval</div>
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
          <div className="gov-stat-subtext">Accepted admission records</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid var(--tricolor-saffron)' }}>
          <div className="gov-stat-label">Duplicate Collisions</div>
          <div className="gov-stat-number" style={{ color: 'var(--tricolor-saffron)' }}>
            {stats?.total_cross_institution_duplicates ?? duplicates.length}
          </div>
          <div className="gov-stat-subtext">Blind index collision flags</div>
        </div>

        <div className="gov-stat-tile" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="gov-stat-label">Student Transfers</div>
          <div className="gov-stat-number" style={{ color: '#6366f1' }}>
            {transfers.length}
          </div>
          <div className="gov-stat-subtext">Inter-institution mobility</div>
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
          aria-selected={activeTab === 'pending'}
          className={`gov-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Onboarding Approvals ({pendingInstitutions.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'duplicates'}
          className={`gov-tab-btn ${activeTab === 'duplicates' ? 'active' : ''}`}
          onClick={() => setActiveTab('duplicates')}
        >
          Collision Candidates ({duplicates.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'transfers'}
          className={`gov-tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          Transfers & Dual Degrees ({transfers.length})
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
        <div className="gov-tab-content">
          {/* TAB 1: National Overview */}
          {activeTab === 'overview' && (
            <div className="gov-panel-column">
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">National Sanctioned Quota Utilization Matrix</h3>
                    <p className="gov-card-subtitle">
                      Cumulative approved intake versus validated enrolments across technical disciplines (AY 2026–27).
                    </p>
                  </div>
                  <div className="gov-header-pill">
                    Overall National Utilization: <strong>{utilizationPct}%</strong>
                  </div>
                </div>
                <div className="gov-card-body">
                  {intakeSummary.length === 0 ? (
                    <div className="gov-empty-state">
                      <p>No intake capacity records mapped for this academic year.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Discipline / Branch Code</th>
                            <th>Programme Description</th>
                            <th>Academic Cycle</th>
                            <th>Sanctioned Quota</th>
                            <th>Validated Admissions</th>
                            <th>Capacity Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {intakeSummary.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong className="mono">{item.programme_code}</strong></td>
                              <td>{item.programme_name}</td>
                              <td>{item.academic_year}</td>
                              <td>{item.total_approved_intake?.toLocaleString()}</td>
                              <td><strong>{item.total_enrolled?.toLocaleString()}</strong></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="gov-progress-bar-bg" style={{ flex: 1 }}>
                                    <div
                                      className="gov-progress-bar-fill"
                                      style={{
                                        width: `${Math.min(100, item.utilization_pct || 0)}%`,
                                        background: item.utilization_pct > 100 ? 'var(--error)' : 'var(--gov-blue-accent)',
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                    {item.utilization_pct}%
                                  </span>
                                </div>
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

          {/* TAB 2: Institutions Directory */}
          {activeTab === 'directory' && (
            <div className="gov-panel-column">
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">AICTE Approved Technical Institutions</h3>
                    <p className="gov-card-subtitle">
                      Directory of technical institutions onboarded for academic student verification.
                    </p>
                  </div>
                  <input
                    type="search"
                    className="gov-form-input sm"
                    placeholder="Search institution by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '320px' }}
                  />
                </div>
                <div className="gov-card-body">
                  <div className="table-responsive">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>Permanent ID</th>
                          <th>Institution Legal Name</th>
                          <th>Programmes</th>
                          <th>Sanctioned Intake</th>
                          <th>Enrolled Students</th>
                          <th>Utilization</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInstitutions.map((inst) => (
                          <tr key={inst.id}>
                            <td><strong className="mono">{inst.code}</strong></td>
                            <td>{inst.name}</td>
                            <td>{inst.programme_count}</td>
                            <td>{inst.approved_intake}</td>
                            <td><strong>{inst.enrolled_count}</strong></td>
                            <td>{inst.utilization_pct}%</td>
                            <td>
                              <span className="gov-chip gov-chip-success">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pending Onboarding Approvals (New AICTE Regulatory Gate) */}
          {activeTab === 'pending' && (
            <div className="gov-panel-column">
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">Pending Institutional Registration Applications</h3>
                    <p className="gov-card-subtitle">
                      Newly registered technical institutions awaiting formal credentials verification under AICTE Approval Hand Book regulations.
                    </p>
                  </div>
                  {!isAdmin && (
                    <span className="gov-chip gov-chip-neutral">
                      Read-Only View (Requires AICTE_ADMIN role to decide)
                    </span>
                  )}
                </div>
                <div className="gov-card-body">
                  {pendingInstitutions.length === 0 ? (
                    <div className="gov-empty-state">
                      <div className="gov-empty-icon-check" aria-hidden="true">✓</div>
                      <h4>No Pending Institution Applications</h4>
                      <p>All institutional registration applications have been reviewed and adjudicated.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Institute Code</th>
                            <th>Institution Legal Name</th>
                            <th>Category</th>
                            <th>Head / Principal</th>
                            <th>Contact Phone</th>
                            <th>State & Location</th>
                            <th>Status</th>
                            <th>Regulatory Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingInstitutions.map((p) => (
                            <tr key={p.id}>
                              <td><strong className="mono">{p.code}</strong></td>
                              <td>
                                <div><strong>{p.name}</strong></div>
                                <small style={{ color: 'var(--text-muted)' }}>{p.address}</small>
                              </td>
                              <td><small>{p.institution_type || 'AFFILIATED'}</small></td>
                              <td>
                                <div>{p.contact_name || '—'}</div>
                                <small style={{ color: 'var(--text-muted)' }}>{p.contact_designation}</small>
                              </td>
                              <td className="mono"><small>{p.contact_phone || '—'}</small></td>
                              <td>{p.state || '—'}</td>
                              <td>
                                <span className="gov-chip gov-chip-warning">
                                  PENDING VERIFICATION
                                </span>
                              </td>
                              <td>
                                {isAdmin ? (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      className="gov-btn gov-btn-primary"
                                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                      onClick={() => handleDecideInstitution(p.id, 'ACTIVE', 'Approved by Central AICTE Director.')}
                                      disabled={actionLoading}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="gov-btn gov-btn-outline"
                                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                                      onClick={() => handleDecideInstitution(p.id, 'REJECTED', 'Credentials did not match AICTE registry.')}
                                      disabled={actionLoading}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Director Approval Only
                                  </span>
                                )}
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

          {/* TAB 4: Duplicate Collisions */}
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

          {/* TAB 5: Transfers & Dual Degrees */}
          {activeTab === 'transfers' && (
            <div className="gov-panel-column">
              <div className="gov-card">
                <div className="gov-card-header">
                  <div>
                    <h3 className="gov-card-title">National Student Transfer & Dual Enrolment Ledger</h3>
                    <p className="gov-card-subtitle">
                      Inter-institutional mobility and dual-degree policy review cases requiring central regulatory adjudication.
                    </p>
                  </div>
                </div>
                <div className="gov-card-body">
                  {transfers.length === 0 ? (
                    <div className="gov-empty-state">
                      <p>No active cross-institution student transfer requests recorded.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Student Ref</th>
                            <th>Masked APAAR</th>
                            <th>Origin Institution</th>
                            <th>Destination Institution</th>
                            <th>Transfer Justification</th>
                            <th>Status</th>
                            <th>Central Adjudication</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transfers.map((t) => (
                            <tr key={t.id}>
                              <td><strong className="mono">{t.student_ref}</strong></td>
                              <td className="mono">{t.apaar_id_masked || '—'}</td>
                              <td>{t.from_institution_name || t.from_institution_id?.slice(0, 8)}</td>
                              <td>{t.to_institution_name || t.to_institution_id?.slice(0, 8)}</td>
                              <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>{t.transfer_reason}</td>
                              <td>
                                <span
                                  className={`gov-chip ${
                                    t.status === 'APPROVED'
                                      ? 'gov-chip-success'
                                      : t.status === 'REJECTED'
                                      ? 'gov-chip-error'
                                      : 'gov-chip-warning'
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td>
                                {t.status === 'PENDING_TRANSFER' ? (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      className="gov-btn gov-btn-primary"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                      onClick={() => handleDecideTransfer(t.id, 'APPROVED', 'Approved by AICTE Central Authority.')}
                                      disabled={actionLoading}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="gov-btn gov-btn-outline"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                      onClick={() => handleDecideTransfer(t.id, 'REQUIRES_POLICY_REVIEW', 'Flagged for dual-degree regulatory review.')}
                                      disabled={actionLoading}
                                    >
                                      Policy Review
                                    </button>
                                  </div>
                                ) : (
                                  <small style={{ color: 'var(--text-muted)' }}>{t.remarks || 'Adjudicated'}</small>
                                )}
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

          {/* TAB 6: Verification Oversight */}
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
