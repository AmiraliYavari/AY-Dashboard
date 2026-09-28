import type { ApiError } from './types';

const API_BASE: string = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

function getToken(): string | null {
  return localStorage.getItem('ay_token');
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function apiRequest<T = unknown>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiError;

  if (res.status === 401 && token) {
    localStorage.removeItem('ay_token');
    localStorage.removeItem('ay_user');
    window.location.href = '/login';
    throw data;
  }
  if (!res.ok) throw data;
  return data;
}
