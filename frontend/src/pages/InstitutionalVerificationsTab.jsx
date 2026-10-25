import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function InstitutionalVerificationsTab({ currentUser }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // New Request Form state (for controlled demonstration/testing)
  const [showNewModal, setShowNewModal] = useState(false);
  const [newStudentRef, setNewStudentRef] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPurpose, setNewPurpose] = useState('EMPLOYMENT_BACKGROUND_CHECK');

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const data = await api.getVerifications(statusFilter || null);
      setVerifications(data || []);
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const handleDecision = async (decision) => {
    if (!selectedRequest) return;
    if (!decisionNotes.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: 'Please provide formal registrar audit notes before recording the determination.',
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.decideVerification(selectedRequest.id, decision, decisionNotes.trim());
      setFeedbackMsg({
        type: 'success',
        text: `Verification request ${selectedRequest.id.slice(0, 8)} successfully updated to ${decision}.`,
      });
      setSelectedRequest(null);
      setDecisionNotes('');
      fetchVerifications();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to submit verification determination.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    const instId = currentUser?.institution_id || '11111111-1111-1111-1111-111111111111';
    if (!newStudentRef.trim() || !newOrg.trim() || !newEmail.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: 'All fields are required to queue a verification inquiry.',
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.createVerificationRequest({
        institution_id: instId,
        student_ref: newStudentRef.trim(),
        requester_org: newOrg.trim(),
        requester_email: newEmail.trim(),
        purpose: newPurpose,
        scope: 'ENROLMENT_STATUS',
        consent_ref: `CONSENT-REF-${Date.now().toString().slice(-6)}`,
        consent_status: 'STUDENT_CONSENT_VERIFIED',
      });
      setShowNewModal(false);
      setNewStudentRef('');
      setNewOrg('');
      setNewEmail('');
      setFeedbackMsg({
        type: 'success',
        text: 'Academic verification request initiated and queued for institutional review.',
      });
      fetchVerifications();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to create verification request.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="gov-page">
      <div className="gov-section-header">
        <div>
          <h2 className="gov-section-title">Academic Verification Requests</h2>
          <p className="gov-section-subtitle">
            Controlled, consent-referenced verification of student enrolment records for authorized requesting bodies.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="gov-btn gov-btn-primary"
            onClick={() => setShowNewModal(true)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Record Verification Request</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`gov-alert-banner ${feedbackMsg.type}`} role="alert">
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            className="gov-alert-close"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <div className="gov-filter-bar">
        <span className="gov-filter-label">Filter Status:</span>
        <div className="gov-filter-chips" role="group" aria-label="Status filters">
          <button
            type="button"
            className={`gov-chip ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            All Requests ({verifications.length})
          </button>
          <button
            type="button"
            className={`gov-chip ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending Determination
          </button>
          <button
            type="button"
            className={`gov-chip ${statusFilter === 'CONFIRMED' || statusFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('CONFIRMED')}
          >
            Confirmed
          </button>
          <button
            type="button"
            className={`gov-chip ${statusFilter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="gov-card table-card">
        {loading ? (
          <div className="gov-loading-state">
            <div className="gov-spinner" aria-hidden="true" />
            <p>Loading institutional verification requests...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="gov-empty-state">
            <h4>No Verification Requests Recorded</h4>
            <p>No active verification requests match the selected status filter for this institution.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student Reference</th>
                  <th>Requesting Body</th>
                  <th>Purpose</th>
                  <th>Scope</th>
                  <th>Consent Status</th>
                  <th>Determination</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v.id}>
                    <td><code>{v.id.slice(0, 8)}...</code></td>
                    <td><strong>{v.student_ref}</strong></td>
                    <td>
                      <div><strong>{v.requester_org}</strong></div>
                      <small style={{ color: 'var(--text-muted)' }}>{v.requester_email}</small>
                    </td>
                    <td>{v.purpose}</td>
                    <td><code>{v.scope}</code></td>
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
                    <td>
                      {v.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="gov-btn-inline-action"
                          onClick={() => {
                            setSelectedRequest(v);
                            setDecisionNotes('');
                          }}
                        >
                          Review Request
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {selectedRequest && (
        <div className="gov-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div
            className="gov-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-heading"
          >
            <div className="gov-modal-header">
              <h3 id="decision-heading">Academic Verification Determination</h3>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="gov-modal-body">
              <div className="gov-dossier-field">
                <span className="gov-dossier-label">Student Reference:</span>
                <span className="gov-dossier-value">{selectedRequest.student_ref}</span>
              </div>
              <div className="gov-dossier-field">
                <span className="gov-dossier-label">Requesting Entity:</span>
                <span className="gov-dossier-value">{selectedRequest.requester_org} ({selectedRequest.requester_email})</span>
              </div>
              <div className="gov-dossier-field">
                <span className="gov-dossier-label">Inquiry Purpose:</span>
                <span className="gov-dossier-value">{selectedRequest.purpose}</span>
              </div>
              <div className="gov-dossier-field">
                <span className="gov-dossier-label">Consent Reference:</span>
                <code className="gov-dossier-value">{selectedRequest.consent_ref || 'STUDENT_SIGNED_CONSENT'}</code>
              </div>

              <div className="gov-form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="reg-notes" className="gov-form-label">
                  Institutional Registrar Audit Notes <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="reg-notes"
                  className="gov-form-textarea"
                  rows="3"
                  placeholder="Record verification register volume, matriculation confirmation, or reason for determination..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="gov-modal-footer">
              <button
                type="button"
                className="gov-btn gov-btn-outline danger"
                disabled={actionLoading}
                onClick={() => handleDecision('REJECTED')}
              >
                Reject Request
              </button>
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                disabled={actionLoading}
                onClick={() => handleDecision('CONFIRMED')}
              >
                {actionLoading ? 'Recording...' : 'Confirm & Validate Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="gov-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div
            className="gov-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-req-heading"
          >
            <div className="gov-modal-header">
              <h3 id="new-req-heading">Record Controlled Academic Verification Inquiry</h3>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setShowNewModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="gov-modal-body">
                <div className="gov-form-group">
                  <label htmlFor="modal-student-ref" className="gov-form-label">
                    Student Reference ID <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="modal-student-ref"
                    type="text"
                    required
                    className="gov-form-input"
                    value={newStudentRef}
                    onChange={(e) => setNewStudentRef(e.target.value)}
                    placeholder="e.g. STU-2026-001"
                  />
                </div>
                <div className="gov-form-group">
                  <label htmlFor="modal-org" className="gov-form-label">
                    Requesting Organization <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="modal-org"
                    type="text"
                    required
                    className="gov-form-input"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    placeholder="e.g. National Scholarship Board or TCS Campus Verification"
                  />
                </div>
                <div className="gov-form-group">
                  <label htmlFor="modal-email" className="gov-form-label">
                    Authorized Contact Email <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    className="gov-form-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. verifications@nsc.gov.in"
                  />
                </div>
                <div className="gov-form-group">
                  <label htmlFor="modal-purpose" className="gov-form-label">
                    Verification Purpose
                  </label>
                  <select
                    id="modal-purpose"
                    className="gov-form-input"
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                  >
                    <option value="EMPLOYMENT_BACKGROUND_CHECK">Employment Background Check</option>
                    <option value="SCHOLARSHIP_VALIDATION">National Fellowship / Scholarship Validation</option>
                    <option value="HIGHER_STUDIES_ADMISSION">Higher Education Admission Verification</option>
                    <option value="AICTE_REGULATORY_AUDIT">AICTE Regulatory Audit</option>
                  </select>
                </div>
              </div>
              <div className="gov-modal-footer">
                <button
                  type="button"
                  className="gov-btn gov-btn-outline"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gov-btn gov-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Recording...' : 'Queue Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
