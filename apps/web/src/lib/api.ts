import { supabase } from './supabase';

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const API_URL = import.meta.env.VITE_API_URL || '';
  const url = `${API_URL}${endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || response.statusText);
    (error as any).response = { status: response.status, data: errorData };
    throw error;
  }

  return { data: await response.json() };
};

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint),
  post: (endpoint: string, data?: any) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  patch: (endpoint: string, data?: any) => fetchWithAuth(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};
