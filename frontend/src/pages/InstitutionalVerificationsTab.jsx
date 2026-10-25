import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function InstitutionalVerificationsTab() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // New Request Form state (for interactive demo testing)
  const [showNewModal, setShowNewModal] = useState(false);
  const [newStudentRef, setNewStudentRef] = useState('STU-2026-001');
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
    try {
      setActionLoading(true);
      await api.decideVerification(selectedRequest.id, decision, decisionNotes);
      setFeedbackMsg({
        type: 'success',
        text: `Verification request ${selectedRequest.id.slice(0, 8)} successfully marked as ${decision}.`,
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
    try {
      setActionLoading(true);
      await api.createVerificationRequest({
        institution_id: '11111111-1111-1111-1111-111111111111',
        student_ref: newStudentRef,
        requester_org: newOrg,
        requester_email: newEmail,
        purpose: newPurpose,
        scope: 'ENROLMENT_STATUS',
        consent_ref: `CONSENT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        consent_status: 'STUDENT_CONSENT_VERIFIED',
      });
      setShowNewModal(false);
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
    <div className="gov-verifications-tab-page">
      {/* Top Banner & Actions */}
      <div className="gov-page-header">
        <div className="gov-page-title-group">
          <h2 className="gov-page-heading">Academic Verification Requests</h2>
          <p className="gov-page-sub">
            Controlled, consent-backed student academic record verification for authorized external bodies.
          </p>
        </div>
        <button
          className="gov-btn-primary"
          onClick={() => setShowNewModal(true)}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-icon">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>Initiate Verification Request</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`gov-alert-banner ${feedbackMsg.type}`} role="alert">
          <span>{feedbackMsg.text}</span>
          <button className="gov-alert-close" onClick={() => setFeedbackMsg(null)}>×</button>
        </div>
      )}

      {/* Filter Strip */}
      <div className="gov-filter-strip">
        <span className="gov-filter-label">Filter by Status:</span>
        <div className="gov-filter-chips">
          <button
            className={`gov-chip ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            All Requests ({verifications.length})
          </button>
          <button
            className={`gov-chip ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending Review
          </button>
          <button
            className={`gov-chip ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('CONFIRMED')}
          >
            Confirmed
          </button>
          <button
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
            <div className="gov-spinner" />
            <p>Loading institutional verification ledger...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="gov-empty-box">
            <h4>No Verification Requests Found</h4>
            <p>No active verification requests match the selected status filter.</p>
          </div>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Student Ref</th>
                <th>Requesting Body</th>
                <th>Purpose</th>
                <th>Scope</th>
                <th>Consent Status</th>
                <th>Determination</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id}>
                  <td><code>{v.id.slice(0, 8)}...</code></td>
                  <td><strong>{v.student_ref}</strong></td>
                  <td>
                    <div><strong>{v.requester_org}</strong></div>
                    <small className="gov-muted-text">{v.requester_email}</small>
                  </td>
                  <td>{v.purpose}</td>
                  <td><code>{v.scope}</code></td>
                  <td>
                    <span className="gov-status-pill success">
                      {v.consent_status || 'STUDENT_CONSENT_VERIFIED'}
                    </span>
                  </td>
                  <td>
                    <span className={`gov-status-pill ${v.status === 'CONFIRMED' ? 'success' : v.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    {v.status === 'PENDING' ? (
                      <button
                        className="gov-btn-table-action"
                        onClick={() => {
                          setSelectedRequest(v);
                          setDecisionNotes('');
                        }}
                      >
                        Review Request
                      </button>
                    ) : (
                      <span className="gov-muted-text">Decided</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Decision Modal */}
      {selectedRequest && (
        <div className="gov-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <h3>Academic Verification Determination</h3>
              <button className="gov-modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="gov-modal-body">
              <p><strong>Student Reference:</strong> {selectedRequest.student_ref}</p>
              <p><strong>Requesting Body:</strong> {selectedRequest.requester_org} ({selectedRequest.requester_email})</p>
              <p><strong>Verification Purpose:</strong> {selectedRequest.purpose}</p>
              <p><strong>Scope:</strong> {selectedRequest.scope}</p>
              <p><strong>Consent Document Reference:</strong> <code>{selectedRequest.consent_ref || 'STUDENT-DOC-SIGNED'}</code></p>

              <div className="gov-form-group" style={{ marginTop: '16px' }}>
                <label className="gov-form-label">Institutional Registrar Audit Notes:</label>
                <textarea
                  className="gov-form-textarea"
                  rows="3"
                  placeholder="Record verification notes, matriculation register volume, or reason for determination..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="gov-modal-footer">
              <button
                type="button"
                className="gov-btn-outline danger"
                disabled={actionLoading}
                onClick={() => handleDecision('REJECTED')}
              >
                Reject Request
              </button>
              <button
                type="button"
                className="gov-btn-primary"
                disabled={actionLoading}
                onClick={() => handleDecision('CONFIRMED')}
              >
                {actionLoading ? 'Processing...' : 'Confirm & Validate Academic Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="gov-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="gov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <h3>Initiate Controlled Academic Verification</h3>
              <button className="gov-modal-close" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="gov-modal-body">
                <div className="gov-form-group">
                  <label className="gov-form-label">Student Reference ID <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className="gov-form-input"
                    value={newStudentRef}
                    onChange={(e) => setNewStudentRef(e.target.value)}
                    placeholder="e.g. STU-2026-001"
                  />
                </div>
                <div className="gov-form-group">
                  <label className="gov-form-label">Requesting Organization <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className="gov-form-input"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    placeholder="e.g. National Fellowship Board or TCS Campus Hiring"
                  />
                </div>
                <div className="gov-form-group">
                  <label className="gov-form-label">Authorized Contact Email <span className="required">*</span></label>
                  <input
                    type="email"
                    required
                    className="gov-form-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. verifications@nfb.gov.in"
                  />
                </div>
                <div className="gov-form-group">
                  <label className="gov-form-label">Verification Purpose</label>
                  <select
                    className="gov-form-input"
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                  >
                    <option value="EMPLOYMENT_BACKGROUND_CHECK">Employment Background Check</option>
                    <option value="SCHOLARSHIP_VALIDATION">National Scholarship / Fellowship Validation</option>
                    <option value="HIGHER_STUDIES_ADMISSION">Higher Education / Transfer Verification</option>
                    <option value="AICTE_REGULATORY_AUDIT">AICTE Regulatory Audit</option>
                  </select>
                </div>
              </div>
              <div className="gov-modal-footer">
                <button
                  type="button"
                  className="gov-btn-text"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gov-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Submitting...' : 'Queue Verification Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

