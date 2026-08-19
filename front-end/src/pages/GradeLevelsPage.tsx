import { useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, TextArea, useToast } from '../components/ui';
import type { GradeLevel } from '../lib/types';

interface FormState {
  name: string;
  level: string;
  stage: string;
  description: string;
}

export default function GradeLevelsPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<GradeLevel>('/grade-levels');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GradeLevel | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', level: '', stage: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', level: '', stage: '', description: '' });
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (g: GradeLevel) => {
    setEditing(g);
    setForm({
      name: g.name,
      level: g.level.toString(),
      stage: g.stage,
      description: g.description ?? '',
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
        level: Number(form.level),
        description: form.description === '' ? null : form.description,
      };
      if (editing) {
        await patch<GradeLevel>(`/grade-levels/${editing.id}`, payload);
        toast('Grade level updated');
      } else {
        await post<GradeLevel>('/grade-levels', payload);
        toast('Grade level created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (g: GradeLevel) => {
    if (!window.confirm(`Delete grade level "${g.name}"?`)) return;
    try {
      await del(`/grade-levels/${g.id}`);
      toast('Grade level deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Grade Levels</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Grade Level
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
                <th>Level</th>
                <th>Stage</th>
                <th>Classes</th>
                <th>Students</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.level}</td>
                  <td>{g.stage}</td>
                  <td>{g.classes_count ?? '-'}</td>
                  <td>{g.students_count ?? '-'}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(g)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(g)}>
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

      <Modal title={editing ? 'Edit Grade Level' : 'New Grade Level'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} noValidate>
          {formError ? <ErrorBox message={formError} /> : null}
          <div className="form-grid">
            <Field label="Name" required error={fieldError(formError, 'name')}>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Grade 1" required />
            </Field>
            <Field label="Level" required error={fieldError(formError, 'level')}>
              <Input
                type="number"
                min={1}
                max={30}
                value={form.level}
                onChange={(e) => set('level', e.target.value)}
                required
              />
            </Field>
            <Field label="Stage" required error={fieldError(formError, 'stage')}>
              <Input value={form.stage} onChange={(e) => set('stage', e.target.value)} placeholder="Primary" required />
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