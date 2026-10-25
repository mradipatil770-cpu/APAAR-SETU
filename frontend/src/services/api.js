/**
 * APAARSetu API Service
 * Communicates with the FastAPI backend.
 * Never stores or requests database passwords or privileged keys in the browser.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    Accept: 'application/json',
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
  getHealth: () => request('/api/v1/health'),
  getReadiness: () => request('/api/v1/ready'),
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
    const url = `${API_BASE_URL}/api/v1/uploads`;
    const response = await fetch(url, {
      method: 'POST',
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
};

