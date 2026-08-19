import { useEffect, useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { loadAcademicYears, loadGradeLevels } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, StatusBadge, TextArea, useToast } from '../components/ui';
import type { AcademicYear, GradeLevel, SchoolClass } from '../lib/types';

interface FormState {
  name: string;
  description: string;
  grade_level_id: string;
  academic_year_id: string;
  capacity: string;
  status: string;
  type: string;
}

export default function ClassesPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<SchoolClass>('/school-classes');
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [g, y] = await Promise.all([loadGradeLevels(), loadAcademicYears()]);
        setGradeLevels(g);
        setYears(y);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  const defaultForm = (): FormState => ({
    name: '',
    description: '',
    grade_level_id: gradeLevels[0]?.id ?? '',
    academic_year_id: years.find((y) => y.is_current)?.id ?? years[0]?.id ?? '',
    capacity: '',
    status: 'active',
    type: 'mix',
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (c: SchoolClass) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? '',
      grade_level_id: c.grade_level_id,
      academic_year_id: c.academic_year_id,
      capacity: c.capacity?.toString() ?? '',
      status: c.status,
      type: c.type,
    });
    setFormError(null);
    setOpen(true);
  };

  const set = (key: keyof FormState, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        capacity: form.capacity === '' ? null : Number(form.capacity),
        description: form.description === '' ? null : form.description,
      };
      if (editing) {
        await patch<SchoolClass>(`/school-classes/${editing.id}`, payload);
        toast('Class updated');
      } else {
        await post<SchoolClass>('/school-classes', payload);
        toast('Class created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (c: SchoolClass) => {
    if (!window.confirm(`Delete class "${c.name}"?`)) return;
    try {
      await del(`/school-classes/${c.id}`);
      toast('Class deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Classes</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Class
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
                <th>Grade Level</th>
                <th>Year</th>
                <th>Capacity</th>
                <th>Students</th>
                <th>Type</th>
                <th>Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.grade_level?.name ?? '-'}</td>
                  <td>{c.academic_year?.name ?? '-'}</td>
                  <td>{c.capacity ?? '-'}</td>
                  <td>{c.students_count ?? '-'}</td>
                  <td>{c.type}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(c)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>
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

      <Modal title={editing ? 'Edit Class' : 'New Class'} open={open} onClose={() => setOpen(false)} wide>
        {form ? (
          <form onSubmit={submit} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="Name" required error={fieldError(formError, 'name')}>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 1-A" required />
              </Field>
              <Field label="Grade level" required error={fieldError(formError, 'grade_level_id')}>
                <Select value={form.grade_level_id} onChange={(e) => set('grade_level_id', e.target.value)} required>
                  {gradeLevels.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Academic year" required error={fieldError(formError, 'academic_year_id')}>
                <Select
                  value={form.academic_year_id}
                  onChange={(e) => set('academic_year_id', e.target.value)}
                  required
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                      {y.is_current ? ' (current)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Capacity" error={fieldError(formError, 'capacity')}>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={form.capacity}
                  onChange={(e) => set('capacity', e.target.value)}
                />
              </Field>
              <Field label="Type" error={fieldError(formError, 'type')}>
                <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="mix">mix</option>
                </Select>
              </Field>
              <Field label="Status" error={fieldError(formError, 'status')}>
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="maintenance">maintenance</option>
                </Select>
              </Field>
              <Field label="Description" error={fieldError(formError, 'description')}>
                <TextArea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
            <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}