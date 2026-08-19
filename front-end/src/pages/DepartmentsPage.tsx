import { useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, TextArea, useToast } from '../components/ui';
import type { Department } from '../lib/types';

interface FormState {
  name: string;
  description: string;
  max_grade: string;
  min_grade: string;
}

export default function DepartmentsPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<Department>('/departments');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', description: '', max_grade: '', min_grade: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', max_grade: '', min_grade: '' });
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({
      name: d.name,
      description: d.description ?? '',
      max_grade: d.max_grade === null || d.max_grade === undefined ? '' : String(d.max_grade),
      min_grade: d.min_grade === null || d.min_grade === undefined ? '' : String(d.min_grade),
    });
    setFormError(null);
    setOpen(true);
  };

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        max_grade: form.max_grade === '' ? null : Number(form.max_grade),
        min_grade: form.min_grade === '' ? null : Number(form.min_grade),
        description: form.description === '' ? null : form.description,
      };
      if (editing) {
        await patch<Department>(`/departments/${editing.id}`, payload);
        toast('Department updated');
      } else {
        await post<Department>('/departments', payload);
        toast('Department created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (d: Department) => {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    try {
      await del(`/departments/${d.id}`);
      toast('Department deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Departments</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Department
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
                <th>Description</th>
                <th>Min grade</th>
                <th>Max grade</th>
                <th>Teachers</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.description ?? '-'}</td>
                  <td>{d.min_grade ?? '-'}</td>
                  <td>{d.max_grade ?? '-'}</td>
                  <td>{d.teachers_count ?? '-'}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(d)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(d)}>
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

      <Modal title={editing ? 'Edit Department' : 'New Department'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} noValidate>
          {formError ? <ErrorBox message={formError} /> : null}
          <div className="form-grid">
            <Field label="Name" required error={fieldError(formError, 'name')}>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            <Field label="Min grade" error={fieldError(formError, 'min_grade')}>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={form.min_grade}
                onChange={(e) => set('min_grade', e.target.value)}
              />
            </Field>
            <Field label="Max grade" error={fieldError(formError, 'max_grade')}>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={form.max_grade}
                onChange={(e) => set('max_grade', e.target.value)}
              />
            </Field>
            <Field label="Description" error={fieldError(formError, 'description')}>
              <TextArea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </div>
          <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </div>
  );
}