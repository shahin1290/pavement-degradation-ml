// All communication with the FastAPI backend.
// Backend address: VITE_API_URL if set (in .env locally or in the Vercel project settings),
// otherwise the Render backend for the deployed site and the local backend for `npm run dev`.

const PRODUCTION_API = 'https://pavement-api-1061126389150.europe-north1.run.app';
const LOCAL_API = 'http://127.0.0.1:8000';

const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PRODUCTION_API : LOCAL_API)
).replace(/\/$/, '');

// Turn FastAPI error responses into one readable message
function errorMessage(body, status) {
  const detail = body?.detail;
  if (Array.isArray(detail)) {
    // Validation errors: [{ loc: [...], msg: '...' }]
    return detail.map((d) => `${(d.loc || []).slice(-1)[0]}: ${d.msg}`).join('; ');
  }
  if (typeof detail === 'string') return detail;
  return `Request failed (HTTP ${status})`;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${API_URL}. Is it running?`);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body, response.status));
  return body;
}

/** Predict E1-E4 for one measurement point. `inputs` = { D0: ..., thk1_mm: ..., ... } */
export function predictModuli(inputs) {
  return request('/api/predict', { method: 'POST', body: JSON.stringify(inputs) });
}

/** Which inputs the current model needs, its limits and test accuracy. */
export function getModelInfo() {
  return request('/api/model-info');
}

export { API_URL };
