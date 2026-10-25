/**
 * APAARSetu API Service
 * Communicates with the FastAPI backend.
 * Uses cryptographically signed Bearer JWT tokens stored in localStorage.
 * Never exposes raw credentials or private keys in the browser.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getStoredToken() {
  try {
    return localStorage.getItem('apaarsetu_token');
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let errorDetail = 'Network request failed';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // --- System Health & Readiness ---
  getHealth: () => request('/api/v1/health'),
  getReadiness: () => request('/api/v1/ready'),

  // --- Authentication ---
  login: (email, password) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/api/v1/auth/me'),

  logout: () => {
    try {
      localStorage.removeItem('apaarsetu_token');
      localStorage.removeItem('apaarsetu_user');
    } catch {
      // ignore
    }
    return request('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
  },

  // --- Institutional Dashboard & Data ---
  getInstitutionDashboard: () => request('/api/v1/institution/dashboard'),
  getAdminDashboard: () => request('/api/v1/admin/dashboard'),

  getUploads: (limit = 20, offset = 0) =>
    request(`/api/v1/uploads?limit=${limit}&offset=${offset}`),

  getUploadDetail: (uploadId) =>
    request(`/api/v1/uploads/${uploadId}`),

  getUploadErrors: (uploadId) =>
    request(`/api/v1/uploads/${uploadId}/errors`),

  uploadCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE_URL}/api/v1/uploads`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      let errorMsg = 'Upload failed';
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || JSON.stringify(errJson);
      } catch {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  },

  getAnomalies: (statusFilter = null) => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    return request(`/api/v1/anomalies${query}`);
  },

  resolveAnomaly: (anomalyId, resolutionNotes, status = 'RESOLVED') =>
    request(`/api/v1/anomalies/${anomalyId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_notes: resolutionNotes, status }),
    }),

  getReportDownloadUrl: () => `${API_BASE_URL}/api/v1/reports`,

  // --- Central AICTE Oversight APIs ---
  getCentralDashboard: () => request('/api/v1/aicte/dashboard'),

  getCentralInstitutions: (search = null) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/v1/aicte/institutions${query}`);
  },

  getCentralInstitutionDetail: (institutionId) =>
    request(`/api/v1/aicte/institutions/${institutionId}`),

  getCentralDuplicates: (status = null) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/v1/aicte/duplicate-candidates${query}`);
  },

  getCentralIntakeSummary: (academicYear = '2026-27') =>
    request(`/api/v1/aicte/intake-summary?academic_year=${encodeURIComponent(academicYear)}`),

  // --- Controlled Academic Verification APIs ---
  getVerifications: (status = null, studentRef = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (studentRef) params.append('student_ref', studentRef);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/v1/verifications${qs}`);
  },

  createVerificationRequest: (payload) =>
    request('/api/v1/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  decideVerification: (verificationId, decision, notes = null) =>
    request(`/api/v1/verifications/${verificationId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: decision,
        decision_notes: notes || 'Verified by institutional authority.',
      }),
    }),
};
