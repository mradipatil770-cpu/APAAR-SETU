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
      setErrorMsg('Invalid file format: Please select a standard .csv file.');
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('File size limit exceeded: Upload must not exceed 5 MB.');
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const downloadSampleTemplate = () => {
    const templateContent =
      'student_ref,apaar_id,programme_code,academic_year,category\n' +
      'STU-2026-001,123456789012,CSE,2026-27,GENERAL\n' +
      'STU-2026-002,123456789013,ECE,2026-27,OBC\n' +
      'STU-2026-003,123456789014,MECH,2026-27,SC\n';
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'apaarsetu_template.csv');
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
    <div className="gov-page">
      <div className="gov-section-header">
        <div>
          <h2 className="gov-section-title">Upload Student Enrolment Batch</h2>
          <p className="gov-section-subtitle">
            Upload institutional student admission records in CSV format for automated validation and intake compliance checking.
          </p>
        </div>
        <div>
          <button type="button" className="gov-btn gov-btn-secondary" onClick={downloadSampleTemplate}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Ingestion Specification Box */}
      <div className="gov-card" style={{ marginBottom: '24px' }}>
        <h3 className="gov-card-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
          Mandatory File Format & Specification
        </h3>
        <ul className="gov-guidelines-list">
          <li>
            <strong>Required Column Headers:</strong> <code className="mono">student_ref, apaar_id, programme_code, academic_year, category</code>
          </li>
          <li>
            <strong>APAAR ID Standard:</strong> Must match the 12-digit numeric structural format. Identifiers are cryptographically encrypted (AES-256-GCM) with blind HMAC indexing.
          </li>
          <li>
            <strong>Quota Verification:</strong> Student admissions are evaluated against approved AICTE branch capacities for Academic Session 2026–27.
          </li>
          <li>
            <strong>File Limits:</strong> Standard UTF-8 encoded CSV files up to 5 MB (maximum 10,000 student records per batch).
          </li>
        </ul>
      </div>

      {/* Upload Dropzone Form */}
      <div className="gov-card" style={{ maxWidth: '720px', margin: '0 auto 24px' }}>
        <form onSubmit={handleUpload}>
          <div
            className={`gov-dropzone ${file ? 'has-file' : ''}`}
            onClick={() => document.getElementById('csvFileInput').click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                document.getElementById('csvFileInput').click();
              }
            }}
          >
            <svg className="gov-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="gov-dropzone-title">Click to browse or drop institutional CSV here</div>
            <div className="gov-dropzone-sub">Accepts standard .csv files up to 5 MB</div>
            <input
              id="csvFileInput"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="gov-file-selected-card">
              <div className="gov-file-selected-info">
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '18px', height: '18px', color: 'var(--gov-navy)' }}>
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span><strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
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
            <div className="gov-alert gov-alert-error" role="alert" style={{ marginTop: '16px' }}>
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              className="gov-btn gov-btn-primary"
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <div className="gov-spinner-sm" aria-hidden="true" />
                  <span>Validating & Ingesting...</span>
                </>
              ) : (
                <span>Validate and Ingest Batch</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Processing Results Card */}
      {uploadResult && (
        <div className="gov-card gov-card-accent-green" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="gov-card-header">
            <div>
              <h3 className="gov-card-title" style={{ color: 'var(--tricolor-green)' }}>
                Batch Ingested Successfully
              </h3>
              <p className="gov-card-subtitle">
                Batch ID: <span className="mono">{uploadResult.id}</span>
              </p>
            </div>
            <span className="gov-chip gov-chip-success">{uploadResult.status}</span>
          </div>

          <div className="gov-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
            <div className="gov-stat-tile">
              <div className="gov-stat-label">Total Rows</div>
              <div className="gov-stat-number">{uploadResult.total_rows}</div>
            </div>
            <div className="gov-stat-tile">
              <div className="gov-stat-label" style={{ color: 'var(--tricolor-green)' }}>Accepted</div>
              <div className="gov-stat-number" style={{ color: 'var(--tricolor-green)' }}>{uploadResult.accepted_rows}</div>
            </div>
            <div className="gov-stat-tile">
              <div className="gov-stat-label" style={{ color: uploadResult.rejected_rows > 0 ? 'var(--error)' : 'inherit' }}>
                Rejected
              </div>
              <div className="gov-stat-number" style={{ color: uploadResult.rejected_rows > 0 ? 'var(--error)' : 'inherit' }}>
                {uploadResult.rejected_rows}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="gov-btn gov-btn-primary"
              onClick={() => onSelectUpload && onSelectUpload(uploadResult.id)}
            >
              <span>Inspect Batch Validation Results →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
