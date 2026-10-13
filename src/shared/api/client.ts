import type { ApiEnvelope } from '../types';

const BASE = (import.meta.env.VITE_API_URL as string) || '';
const ACCESS_KEY = 'dm_access_token';

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let refreshing: Promise<string | null> | null = null;

export function getAccessToken() { return accessToken; }

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem(ACCESS_KEY, token);
  else localStorage.removeItem(ACCESS_KEY);
}

export class ApiError extends Error {
  status: number;
  errors: unknown;
  constructor(status: number, message: string, errors: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) return null;
        const json = (await r.json()) as ApiEnvelope<{ accessToken: string }>;
        setAccessToken(json.data.accessToken);
        return json.data.accessToken;
      })
      .catch(() => null)
      .finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  }
  return refreshing;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, retry = true, headers, ...rest } = options;

  const isFormData = body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers as Record<string, string>),
    },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry && auth) {
    const fresh = await refreshAccessToken();
    if (fresh) return api<T>(path, { ...options, retry: false });
    setAccessToken(null);
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({ success: res.ok, data: null, message: '', errors: null } as ApiEnvelope<T>);

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message || `Request failed (${res.status})`, json.errors);
  }
  return json.data;
}

export const apiUrl = (path: string) => `${BASE}${path}`;