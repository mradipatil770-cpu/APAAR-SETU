import React, { useState } from 'react';
import { api } from '../services/api';

export default function UploadPage({ onUploadComplete, onSelectUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setErrorMsg('');
    setUploadResult(null);
    const selected = e.target.files[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Invalid file type: Please select a file with .csv extension.');
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('File too large: CSV exceeds the maximum prototype limit of 5 MB.');
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const downloadSampleTemplate = () => {
    const templateContent = "student_ref,apaar_id,programme_code,academic_year,category\nSTU-2026-001,123456789012,CSE,2026-27,GENERAL\nSTU-2026-002,123456789013,ECE,2026-27,OBC\n";
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'apaarsetu_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setUploadResult(null);

    try {
      const result = await api.uploadCsv(file);
      setUploadResult(result);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Batch upload processing failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="gov-section-header">
        <div>
          <h2>Institutional Student CSV Batch Ingestion</h2>
          <p>Securely upload and validate synthetic student enrolment records against AICTE-approved academic intakes.</p>
        </div>
        <div>
          <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={downloadSampleTemplate}>
            📥 Download Sample CSV Template
          </button>
        </div>
      </div>

      {/* Official Guidelines Box */}
      <div className="gov-card gov-card-accent-top" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.98rem', color: 'var(--gov-navy)', marginBottom: '8px' }}>
          Mandatory Ingestion Guidelines (Format Standard v1.2)
        </h3>
        <ul style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.7', paddingLeft: '20px' }}>
          <li>
            CSV must include all 5 required headers: <code className="mono">student_ref, apaar_id, programme_code, academic_year, category</code>
          </li>
          <li>
            <strong>APAAR ID Standard:</strong> Must match the 12-digit numeric prototype format.
            (Structural check only; does not replace official government verification).
          </li>
          <li>
            <strong>Security & Privacy:</strong> All valid APAAR IDs are encrypted using <strong>AES-256-GCM</strong> and indexed via keyed <strong>HMAC-SHA-256</strong> to prevent plaintext leakage.
          </li>
          <li>
            <strong>File Limits:</strong> Maximum 5 MB per batch, up to 10,000 student records.
          </li>
        </ul>
      </div>

      {/* Upload Dropzone Card */}
      <div className="gov-card" style={{ maxWidth: '720px', margin: '0 auto 24px' }}>
        <form onSubmit={handleUpload}>
          <div className="gov-dropzone" onClick={() => document.getElementById('csvFileInput').click()}>
            <svg
              style={{ width: '44px', height: '44px', color: 'var(--gov-navy)', margin: '0 auto 10px' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>Click to browse or drop institutional CSV here</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Standard UTF-8 encoded .csv files up to 5 MB
            </p>
            <input
              id="csvFileInput"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--gov-navy)' }}>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
              <button
                type="button"
                className="gov-btn gov-btn-secondary gov-btn-sm"
                onClick={() => { setFile(null); setErrorMsg(''); }}
              >
                Remove
              </button>
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '4px', color: 'var(--error)', fontSize: '0.85rem' }}>
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              className="gov-btn gov-btn-primary"
              disabled={!file || uploading}
            >
              {uploading ? 'Validating & Encrypting...' : 'Submit & Process Batch'}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Processing Results Card */}
      {uploadResult && (
        <div className="gov-card gov-card-accent-green" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--green-india)', marginBottom: '6px' }}>
            Batch Processing Completed Successfully
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Batch ID: <span className="mono">{uploadResult.id}</span> | Timestamp: {new Date(uploadResult.created_at).toLocaleString()}
          </p>

          <div className="gov-stats-grid" style={{ marginTop: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Rows</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gov-navy)' }}>{uploadResult.total_rows}</div>
            </div>
            <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>Accepted & Enrolled</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{uploadResult.accepted_rows}</div>
            </div>
            <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--error)', fontWeight: 600 }}>Rejected Rows</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--error)' }}>{uploadResult.rejected_rows}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Captured <strong>{uploadResult.issue_count}</strong> validation findings / candidate anomalies.
            </span>
            <button
              className="gov-btn gov-btn-primary gov-btn-sm"
              onClick={() => onSelectUpload(uploadResult.id)}
            >
              Inspect Row-Level Findings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
