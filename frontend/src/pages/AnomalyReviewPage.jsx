import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AnomalyReviewPage({ onAnomalyUpdated }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [decision, setDecision] = useState('RESOLVED');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await api.getAnomalies(statusFilter === 'ALL' ? null : statusFilter);
      setAnomalies(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve exception cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, [statusFilter]);

  const handleOpenModal = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setResolutionNotes(anomaly.resolution_notes || '');
    setDecision('RESOLVED');
    setActionFeedback('');
  };

  const handleCloseModal = () => {
    setSelectedAnomaly(null);
    setResolutionNotes('');
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    if (resolutionNotes.trim().length < 3) {
      alert('Mandatory Requirement: Please provide administrative verification remarks (minimum 3 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await api.resolveAnomaly(selectedAnomaly.id, resolutionNotes.trim(), decision);
      handleCloseModal();
      loadAnomalies();
      if (onAnomalyUpdated) onAnomalyUpdated();
    } catch (err) {
      alert('Verification submission error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gov-page">
      <div className="gov-section-header">
        <div>
          <h2 className="gov-section-title">Review Exceptions</h2>
          <p className="gov-section-subtitle">
            Review identified duplicate candidates, cross-enrolment collisions, and intake capacity warnings. Findings represent potential discrepancies for administrative verification.
          </p>
        </div>
        <div>
          <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={loadAnomalies}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}>
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      <div className="gov-card">
        <div className="gov-card-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            {['OPEN', 'RESOLVED', 'ALL'].map((st) => (
              <button
                key={st}
                className={`gov-btn gov-btn-sm ${statusFilter === st ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'OPEN' ? 'Open Cases' : st === 'RESOLVED' ? 'Resolved Cases' : 'All Cases'}
              </button>
            ))}
          </div>
          <span className="gov-card-badge">
            Total Cases: <strong>{anomalies.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="gov-empty-state">
            <div className="gov-spinner" aria-hidden="true" />
            <p style={{ marginTop: '12px' }}>Retrieving exception records...</p>
          </div>
        ) : errorMsg ? (
          <div className="gov-alert gov-alert-error" role="alert">
            {errorMsg}
          </div>
        ) : anomalies.length === 0 ? (
          <div className="gov-empty-state">
            <p>No exceptions found matching the selected filter ({statusFilter}).</p>
          </div>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Student Reference</th>
                  <th>APAAR ID</th>
                  <th>Finding Code</th>
                  <th>Explanation</th>
                  <th>Status</th>
                  <th>Recorded (UTC)</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a.id}>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>{a.id.substring(0, 8)}...</td>
                    <td><strong className="mono">{a.student_ref || '—'}</strong></td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>
                      {a.apaar_id || '—'}
                    </td>
                    <td>
                      <span className="gov-code-badge">{a.issue_code}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '380px' }}>
                      {a.explanation}
                      {a.resolution_notes && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          Remarks: {a.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`gov-chip ${
                          a.status === 'RESOLVED'
                            ? 'gov-chip-success'
                            : a.status === 'IGNORED'
                            ? 'gov-chip-neutral'
                            : 'gov-chip-warning'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(a.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="gov-btn gov-btn-secondary gov-btn-sm"
                        onClick={() => handleOpenModal(a)}
                      >
                        {a.status === 'OPEN' ? 'Review & Determine' : 'Update'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Determination Modal */}
      {selectedAnomaly && (
        <div className="gov-modal-backdrop" role="dialog" aria-modal="true">
          <div className="gov-modal-card">
            <div className="gov-card-header">
              <h3 className="gov-card-title">Administrative Determination</h3>
              <button
                type="button"
                className="gov-modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="gov-modal-body">
              <div className="gov-modal-meta-grid">
                <div>
                  <span className="gov-modal-meta-label">Case ID:</span>
                  <span className="mono">{selectedAnomaly.id}</span>
                </div>
                <div>
                  <span className="gov-modal-meta-label">Student Reference:</span>
                  <span className="mono">{selectedAnomaly.student_ref || '—'}</span>
                </div>
                <div>
                  <span className="gov-modal-meta-label">Finding:</span>
                  <span className="gov-code-badge">{selectedAnomaly.issue_code}</span>
                </div>
                <div>
                  <span className="gov-modal-meta-label">Current Status:</span>
                  <span className="gov-chip gov-chip-neutral">{selectedAnomaly.status}</span>
                </div>
              </div>

              <div className="gov-modal-explanation">
                <strong>Description:</strong> {selectedAnomaly.explanation}
              </div>

              <form onSubmit={handleSubmitResolution}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="gov-form-label">Determination Action</label>
                  <div className="gov-radio-group">
                    <label className="gov-radio-label">
                      <input
                        type="radio"
                        name="decision"
                        value="RESOLVED"
                        checked={decision === 'RESOLVED'}
                        onChange={(e) => setDecision(e.target.value)}
                      />
                      <span><strong>RESOLVED</strong> (Verified & Confirmed Valid)</span>
                    </label>
                    <label className="gov-radio-label">
                      <input
                        type="radio"
                        name="decision"
                        value="IGNORED"
                        checked={decision === 'IGNORED'}
                        onChange={(e) => setDecision(e.target.value)}
                      />
                      <span><strong>IGNORED</strong> (False Positive / Cancelled Admission)</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="gov-form-label" htmlFor="resolutionRemarks">
                    Administrative Verification Remarks <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <textarea
                    id="resolutionRemarks"
                    className="gov-textarea"
                    rows={3}
                    placeholder="Document administrative verification steps and rationale..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  />
                  <div className="gov-form-help">Minimum 3 characters required. Permanently logged in audit trail.</div>
                </div>

                <div className="gov-modal-actions">
                  <button type="button" className="gov-btn gov-btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="gov-btn gov-btn-primary" disabled={submitting}>
                    {submitting ? 'Saving Determination...' : 'Save Determination'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
