import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ApiPaginated } from '../lib/types';
import { getList } from '../lib/api';

export type Tone = 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'gray';

const toneClass: Record<Tone, string> = {
  green: 'badge-green',
  red: 'badge-red',
  amber: 'badge-amber',
  blue: 'badge-blue',
  violet: 'badge-violet',
  gray: 'badge-gray',
};

export function statusTone(status: string): Tone {
  const map: Record<string, Tone> = {
    active: 'green',
    present: 'green',
    passed: 'green',
    published: 'green',
    completed: 'green',
    inactive: 'gray',
    maintenance: 'amber',
    late: 'amber',
    draft: 'amber',
    scheduled: 'blue',
    absent: 'red',
    failed: 'red',
    cancelled: 'red',
  };
  return map[status] ?? 'gray';
}

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`badge ${toneClass[tone]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export function Spinner() {
  return <div className="spinner" />;
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner />
    </div>
  );
}

export function EmptyState({ message = 'No records found.' }: { message?: string }) {
  return <div className="empty-state">{message}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return <div className="error-box">{message}</div>;
}

export function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  last,
  onPage,
}: {
  page: number;
  last: number;
  onPage: (page: number) => void;
}) {
  if (last <= 1) return null;
  const pages: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(last, page + 2);
  for (let i = from; i <= to; i++) pages.push(i);
  return (
    <div className="pagination">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-ghost ${p === page ? 'active' : ''}`}
          onClick={() => onPage(p)}
        >
          {p}
        </button>
      ))}
      <button className="btn btn-ghost" disabled={page >= last} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastContextValue {
  toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, tone: Tone = 'green') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${toneClass[t.tone]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function Modal({
  title,
  open,
  onClose,
  children,
  wide,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required ? <span className="required"> *</span> : null}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input ${props.className ?? ''}`} />;
}

export function FormActions({ submitting, onCancel }: { submitting: boolean; onCancel?: () => void }) {
  return (
    <div className="form-actions">
      {onCancel ? (
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

interface PagedState<T> {
  rows: T[];
  meta: { current_page: number; per_page: number; total: number; last_page: number } | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setPage: (page: number) => void;
  setParams: (params: Record<string, unknown>) => void;
}

export function usePaged<T>(url: string, initialParams: Record<string, unknown> = {}): PagedState<T> {
  const [params, setParams] = useState(initialParams);
  const [page, setPageState] = useState(1);
  const [state, setState] = useState<{
    rows: T[];
    meta: PagedState<T>['meta'];
    loading: boolean;
    error: string | null;
  }>({ rows: [], meta: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getList<T>(url, { ...params, page })
      .then((res) => {
        if (cancelled) return;
        setState({ rows: res.data, meta: res.meta, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: err?.response?.data?.message ?? 'Failed to load data.' }));
      });
    return () => {
      cancelled = true;
    };
  }, [url, page, params, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setPage = useCallback((p: number) => setPageState(p), []);

  return { ...state, reload, setPage, setParams };
}