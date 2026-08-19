import axios, { AxiosError } from 'axios';
import type { ApiEnvelope, ApiErrorEnvelope, ApiPaginated } from './types';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorEnvelope>) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export async function getList<T>(url: string, params?: Record<string, unknown>): Promise<ApiPaginated<T>> {
  const { data } = await api.get<ApiPaginated<T>>(url, { params });
  return data;
}

export async function getOne<T>(url: string, params?: Record<string, unknown>): Promise<ApiEnvelope<T>> {
  const { data } = await api.get<ApiEnvelope<T>>(url, { params });
  return data;
}

export async function post<T>(url: string, body?: unknown): Promise<ApiEnvelope<T>> {
  const { data } = await api.post<ApiEnvelope<T>>(url, body);
  return data;
}

export async function patch<T>(url: string, body?: unknown): Promise<ApiEnvelope<T>> {
  const { data } = await api.patch<ApiEnvelope<T>>(url, body);
  return data;
}

export async function del<T>(url: string): Promise<ApiEnvelope<T>> {
  const { data } = await api.delete<ApiEnvelope<T>>(url);
  return data;
}

export function errorMessage(error: unknown): string {
  const err = error as AxiosError<ApiErrorEnvelope>;
  const envelope = err?.response?.data;
  if (envelope?.errors) {
    const first = Object.values(envelope.errors).flat()[0];
    if (first) return first;
  }
  if (envelope?.message) return envelope.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Make sure the backend is running.';
  return 'Something went wrong. Please try again.';
}

export function fieldError(error: unknown, field: string): string | undefined {
  const err = error as AxiosError<ApiErrorEnvelope>;
  const errors = err?.response?.data?.errors;
  if (!errors) return undefined;
  const first = errors[field]?.[0];
  return typeof first === 'string' ? first : undefined;
}