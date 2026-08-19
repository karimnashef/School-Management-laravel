import { useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { usePaged, Badge, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, useToast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { AcademicYear } from '../lib/types';

interface FormState {
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export default function AcademicYearsPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<AcademicYear>('/academic-years');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', start_date: '', end_date: '', is_current: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', start_date: '', end_date: '', is_current: false });
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    setForm({
      name: y.name,
      start_date: y.start_date?.slice(0, 10) ?? '',
      end_date: y.end_date?.slice(0, 10) ?? '',
      is_current: y.is_current,
    });
    setFormError(null);
    setOpen(true);
  };

  const set = (key: keyof FormState, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await patch<AcademicYear>(`/academic-years/${editing.id}`, form);
        toast('Academic year updated');
      } else {
        await post<AcademicYear>('/academic-years', form);
        toast('Academic year created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const setCurrent = async (y: AcademicYear) => {
    try {
      await post<AcademicYear>(`/academic-years/${y.id}/set-current`);
      toast(`${y.name} is now the current year`);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  const remove = async (y: AcademicYear) => {
    if (!window.confirm(`Delete academic year "${y.name}"?`)) return;
    try {
      await del(`/academic-years/${y.id}`);
      toast('Academic year deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Academic Years</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Year
        </button>
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Current</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((y) => (
                <tr key={y.id}>
                  <td>{y.name}</td>
                  <td>{fmtDate(y.start_date)}</td>
                  <td>{fmtDate(y.end_date)}</td>
                  <td>{y.is_current ? <Badge tone="green">current</Badge> : <Badge tone="gray">no</Badge>}</td>
                  <td className="td-actions">
                    {!y.is_current ? (
                      <button className="btn btn-sm btn-primary" onClick={() => setCurrent(y)}>
                        Set current
                      </button>
                    ) : null}
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(y)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(y)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta ? <Pagination page={meta.current_page} last={meta.last_page} onPage={setPage} /> : null}
        </div>
      )}

      <Modal title={editing ? 'Edit Academic Year' : 'New Academic Year'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} noValidate>
          {formError ? <ErrorBox message={formError} /> : null}
          <div className="form-grid">
            <Field label="Name" required error={fieldError(formError, 'name')}>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="2026/2027" required />
            </Field>
            <Field label="Start date" required error={fieldError(formError, 'start_date')}>
              <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required />
            </Field>
            <Field label="End date" required error={fieldError(formError, 'end_date')}>
              <Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} required />
            </Field>
            <label className="field">
              <span className="field-label">Mark as current</span>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(e) => set('is_current', e.target.checked)}
                />
                This is the active academic year
              </label>
            </label>
          </div>
          <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </div>
  );
}