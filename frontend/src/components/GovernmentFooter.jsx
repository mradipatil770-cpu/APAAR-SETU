import React from 'react';

export default function GovernmentFooter() {
  return (
    <footer className="gov-footer">
      <div className="gov-footer-inner">
        <div className="gov-footer-col">
          <h4>About APAARSetu</h4>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.82rem' }}>
            APAARSetu is an institutional prototype engineered for AICTE-approved colleges to validate synthetic
            student admission batches, detect potential duplicate registrations, and monitor sanctioned intake quotas.
          </p>
        </div>

        <div className="gov-footer-col">
          <h4>Institutional Links</h4>
          <ul>
            <li><a href="#overview">Institutional Dashboard</a></li>
            <li><a href="#upload">Batch CSV Ingestion</a></li>
            <li><a href="#anomalies">Verification Queue</a></li>
            <li><a href="#reports">Audit & Compliance Reports</a></li>
          </ul>
        </div>

        <div className="gov-footer-col">
          <h4>Security Architecture</h4>
          <ul>
            <li><span style={{ color: '#86efac' }}>✔</span> AES-256-GCM Field Encryption</li>
            <li><span style={{ color: '#86efac' }}>✔</span> Keyed HMAC-SHA-256 Blind Indexing</li>
            <li><span style={{ color: '#86efac' }}>✔</span> Multi-Tenant Isolation & RLS</li>
            <li><span style={{ color: '#86efac' }}>✔</span> CWE-1236 Formula Injection Defense</li>
          </ul>
        </div>

        <div className="gov-footer-col">
          <h4>Government Initiatives</h4>
          <ul>
            <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer">AICTE Official Portal</a></li>
            <li><a href="https://www.abc.gov.in" target="_blank" rel="noreferrer">Academic Bank of Credits (ABC)</a></li>
            <li><a href="https://nad.gov.in" target="_blank" rel="noreferrer">National Academic Depository (NAD)</a></li>
            <li><a href="https://www.digilocker.gov.in" target="_blank" rel="noreferrer">DigiLocker Services</a></li>
          </ul>
        </div>
      </div>

      <div className="gov-footer-bottom">
        <div>
          <strong>PROTOTYPE NOTICE:</strong> Designed for AICTE-approved institutions. Format checking is structural only and not official government verification. All records are 100% synthetic.
        </div>
        <div>
          <span>Last Updated: 25 October 2026</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>Version 1.1.0-secure</span>
        </div>
      </div>
    </footer>
  );
}

