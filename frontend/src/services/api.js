const API_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body) =>
      fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(body),
      }).then(handleResponse),

    login: (body) =>
      fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(body),
      }).then(handleResponse),

    me: () =>
      fetch(`${API_URL}/api/auth/me`, { headers: getHeaders() }).then(
        handleResponse
      ),

    changePassword: (body) =>
      fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),
  },

  admins: {
    list: () =>
      fetch(`${API_URL}/api/admins`, { headers: getHeaders() }).then(
        handleResponse
      ),
  },

  projects: {
    list: () =>
      fetch(`${API_URL}/api/projects`, { headers: getHeaders() }).then(
        handleResponse
      ),
    tree: () =>
      fetch(`${API_URL}/api/projects/tree`, { headers: getHeaders() }).then(
        handleResponse
      ),
    get: (id) =>
      fetch(`${API_URL}/api/projects/${id}`, { headers: getHeaders() }).then(
        handleResponse
      ),
    create: (body) =>
      fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),
  },

  services: {
    list: (params) => {
      const q = new URLSearchParams(params).toString();
      return fetch(`${API_URL}/api/services${q ? `?${q}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse);
    },
    create: (body) =>
      fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse),
  },

  usage: {
    summary: (params) => {
      const q = new URLSearchParams(params).toString();
      return fetch(`${API_URL}/api/usage/summary${q ? `?${q}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse);
    },
    endpoints: (params) => {
      const q = new URLSearchParams(params).toString();
      return fetch(`${API_URL}/api/usage/endpoints${q ? `?${q}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse);
    },
    trends: (params) => {
      const q = new URLSearchParams(params).toString();
      return fetch(`${API_URL}/api/usage/trends${q ? `?${q}` : ''}`, {
        headers: getHeaders(),
      }).then(handleResponse);
    },
  },
};
