import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../i18n/translations';

export default function InstitutionalTransfersTab({ currentUser, lang = 'en' }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [studentRef, setStudentRef] = useState('');
  const [toInstitutionCode, setToInstitutionCode] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await api.getInstitutionTransfers();
      setTransfers(data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load transfer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!studentRef.trim() || !toInstitutionCode.trim() || !transferReason.trim()) {
      setErrorMsg('Please complete all required transfer fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.initiateTransfer({
        student_ref: studentRef.trim(),
        to_institution_code: toInstitutionCode.trim().toUpperCase(),
        transfer_reason: transferReason.trim(),
      });
      setSuccessMsg(`Transfer request initiated successfully for student ${studentRef.trim()}.`);
      setShowModal(false);
      setStudentRef('');
      setToInstitutionCode('');
      setTransferReason('');
      fetchTransfers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate transfer request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gov-page">
      <div className="gov-section-header">
        <div>
          <div className="gov-header-tagline">
            <span>Inter-Institutional Student Mobility & Migration</span>
            <span className="gov-utility-separator">•</span>
            <span>AICTE Regulatory Norms</span>
          </div>
          <h2 className="gov-section-title">Student Transfer & Migration Ledger</h2>
          <div className="gov-section-meta">
            <span>Official ledger tracking student mobility between AICTE-approved institutions</span>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="gov-btn gov-btn-primary"
            onClick={() => {
              setShowModal(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="gov-btn-svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Initiate Transfer Request</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="gov-alert-banner success" style={{ marginBottom: '16px' }}>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="gov-alert-banner error" style={{ marginBottom: '16px' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Transfer Requests Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <h3 className="gov-card-title">Active & Historical Transfer Requests</h3>
            <p className="gov-card-subtitle">
              Listing all student migration requests originating from or addressed to this institution.
            </p>
          </div>
          <button
            type="button"
            className="gov-btn gov-btn-outline"
            onClick={fetchTransfers}
            title="Refresh transfer records"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="gov-spinner" />
            <p style={{ marginTop: '8px' }}>Loading transfer records...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No active student transfer requests recorded for this institution.</p>
          </div>
        ) : (
          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Student Reference</th>
                  <th>Masked APAAR ID</th>
                  <th>Direction</th>
                  <th>Counterpart Institution</th>
                  <th>Reason for Migration</th>
                  <th>Status</th>
                  <th>Initiated Date</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((item) => {
                  const isOutgoing = String(item.from_institution_id) === String(currentUser?.institution_id);
                  return (
                    <tr key={item.id}>
                      <td className="mono font-bold">{item.student_ref}</td>
                      <td className="mono">{item.apaar_id_masked || '—'}</td>
                      <td>
                        <span className={`gov-chip ${isOutgoing ? 'gov-chip-neutral' : 'gov-chip-info'}`}>
                          {isOutgoing ? 'Outgoing (Transfer-Out)' : 'Incoming (Transfer-In)'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {isOutgoing ? (item.to_institution_name || 'Destination Institution') : (item.from_institution_name || 'Origin Institution')}
                        </div>
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>{item.transfer_reason}</td>
                      <td>
                        <span
                          className={`gov-chip ${
                            item.status === 'APPROVED'
                              ? 'gov-chip-success'
                              : item.status === 'REJECTED'
                              ? 'gov-chip-error'
                              : 'gov-chip-warning'
                          }`}
                        >
                          {getTranslation(`status_${item.status}`, lang)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Initiating Transfer */}
      {showModal && (
        <div className="gov-modal-backdrop" role="dialog" aria-modal="true">
          <div className="gov-modal-card">
            <div className="gov-modal-header">
              <h3 className="gov-modal-title">Initiate Inter-Institutional Student Transfer</h3>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleInitiateTransfer} className="gov-modal-body">
              <div className="gov-form-group">
                <label className="gov-form-label">
                  Student Institutional Reference ID <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="gov-form-input"
                  placeholder="e.g. STU-2026-001"
                  value={studentRef}
                  onChange={(e) => setStudentRef(e.target.value)}
                  required
                />
                <span className="gov-form-hint">
                  Must correspond to an enrolled student currently validated in your institution.
                </span>
              </div>

              <div className="gov-form-group">
                <label className="gov-form-label">
                  Destination AICTE Institute Code <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="gov-form-input"
                  placeholder="e.g. AICTE-ENG-002"
                  value={toInstitutionCode}
                  onChange={(e) => setToInstitutionCode(e.target.value)}
                  required
                />
                <span className="gov-form-hint">
                  Permanent AICTE identification code of the receiving technical institution.
                </span>
              </div>

              <div className="gov-form-group">
                <label className="gov-form-label">
                  Transfer Justification & Documentation Reference <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <textarea
                  className="gov-form-input"
                  rows="3"
                  placeholder="State the official grounds for inter-institutional migration (e.g. parent transfer, medical reasons, NOC reference number)..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  required
                />
              </div>

              <div className="gov-modal-actions">
                <button
                  type="button"
                  className="gov-btn gov-btn-outline"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gov-btn gov-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Transfer...' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

