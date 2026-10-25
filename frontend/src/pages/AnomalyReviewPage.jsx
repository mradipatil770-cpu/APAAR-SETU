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

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const data = await api.getAnomalies(statusFilter === 'ALL' ? null : statusFilter);
      setAnomalies(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve anomaly verification queue.');
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
    <div>
      <div className="gov-section-header">
        <div>
          <h2>Institutional Anomaly Verification Queue</h2>
          <p>
            Review duplicate candidates, active admission collisions, and intake capacity warnings.
            (Note: Duplicate candidate alerts represent findings for verification, not automatic fraud).
          </p>
        </div>
        <div>
          <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={loadAnomalies}>
            🔄 Refresh Queue
          </button>
        </div>
      </div>

      <div className="gov-card gov-card-accent-saffron">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['OPEN', 'RESOLVED', 'ALL'].map((st) => (
              <button
                key={st}
                className={`gov-btn gov-btn-sm ${statusFilter === st ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st} Cases
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{anomalies.length}</strong> case records
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading verification cases from database...
          </p>
        ) : errorMsg ? (
          <p style={{ color: 'var(--error)', padding: '16px' }}>{errorMsg}</p>
        ) : anomalies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600 }}>No anomaly verification records matching status '{statusFilter}'.</p>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>All submitted institutional batches are compliant.</p>
          </div>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Student Ref</th>
                  <th>APAAR ID (Masked)</th>
                  <th>Flag Code</th>
                  <th>Administrative Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a) => (
                  <tr key={a.id}>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>{a.id.substring(0, 8)}...</td>
                    <td className="mono">{a.student_ref || '—'}</td>
                    <td className="mono">{a.apaar_id || '—'}</td>
                    <td>
                      <code className="mono" style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>
                        {a.issue_code}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>{a.explanation}</td>
                    <td>
                      <span className={`gov-chip ${a.status === 'OPEN' ? 'gov-chip-warning' : 'gov-chip-success'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="gov-btn gov-btn-secondary gov-btn-sm"
                        onClick={() => handleOpenModal(a)}
                      >
                        {a.status === 'OPEN' ? 'Review & Verify' : 'View Findings'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Resolution Modal */}
      {selectedAnomaly && (
        <div className="gov-modal-backdrop" onClick={handleCloseModal}>
          <div className="gov-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--gov-navy)', marginBottom: '4px' }}>
              Verification Action: {selectedAnomaly.issue_code}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Student Reference: <span className="mono">{selectedAnomaly.student_ref || 'N/A'}</span> | Masked APAAR:{' '}
              <span className="mono">{selectedAnomaly.apaar_id || 'N/A'}</span>
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', margin: '14px 0', fontSize: '0.84rem' }}>
              <strong>Flagged Finding:</strong> {selectedAnomaly.explanation}
            </div>

            <form onSubmit={handleSubmitResolution}>
              <div className="gov-form-group">
                <label>Verification Determination</label>
                <select className="gov-form-control" value={decision} onChange={(e) => setDecision(e.target.value)}>
                  <option value="RESOLVED">RESOLVED — Verified Legitimate Admission (Clear Finding)</option>
                  <option value="IGNORED">IGNORED — False Positive / Permitted Statutory Exception</option>
                </select>
              </div>

              <div className="gov-form-group">
                <label>Administrative Verification Remarks / Documentation Basis</label>
                <textarea
                  className="gov-form-control"
                  rows={4}
                  placeholder="State the institutional verification procedure executed (e.g. cross-referenced physical registration slip, state counseling merit list, original certificates verified)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="gov-btn gov-btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="gov-btn gov-btn-primary" disabled={submitting}>
                  {submitting ? 'Recording Audit...' : 'Commit Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
