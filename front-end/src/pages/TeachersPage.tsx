import { useEffect, useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { loadDepartments, loadUsers } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, TextArea, useToast } from '../components/ui';
import { fmtDate, fmtMoney } from '../lib/format';
import type { Department, Teacher, User } from '../lib/types';

interface FormState {
  user_id: string;
  department_id: string;
  qualification: string;
  join_date: string;
  required_shifts_per_week: string;
  price_per_shift: string;
}

export default function TeachersPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<Teacher>('/teachers');
  const [teacherUsers, setTeacherUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, d] = await Promise.all([loadUsers('teacher'), loadDepartments()]);
        setTeacherUsers(u);
        setDepartments(d);
      } catch {
        // refs are optional for viewing
      }
    })();
  }, []);

  const defaultForm = (): FormState => ({
    user_id: teacherUsers[0]?.id ?? '',
    department_id: departments[0]?.id ?? '',
    qualification: '',
    join_date: new Date().toISOString().slice(0, 10),
    required_shifts_per_week: '',
    price_per_shift: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      user_id: t.user_id,
      department_id: t.department_id,
      qualification: t.qualification ?? '',
      join_date: t.join_date?.slice(0, 10) ?? '',
      required_shifts_per_week: t.required_shifts_per_week?.toString() ?? '',
      price_per_shift: t.price_per_shift === null || t.price_per_shift === undefined ? '' : String(t.price_per_shift),
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
        required_shifts_per_week: form.required_shifts_per_week === '' ? null : Number(form.required_shifts_per_week),
        price_per_shift: form.price_per_shift === '' ? null : Number(form.price_per_shift),
        qualification: form.qualification === '' ? null : form.qualification,
      };
      if (editing) {
        await patch<Teacher>(`/teachers/${editing.id}`, payload);
        toast('Teacher updated');
      } else {
        await post<Teacher>('/teachers', payload);
        toast('Teacher created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (t: Teacher) => {
    if (!window.confirm(`Delete teacher "${t.user?.full_name}"?`)) return;
    try {
      await del(`/teachers/${t.id}`);
      toast('Teacher deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Teachers</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Teacher
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
                <th>Department</th>
                <th>Qualification</th>
                <th>Joined</th>
                <th>Shifts/week</th>
                <th>Price/shift</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.user?.full_name ?? '-'}</td>
                  <td>{t.department?.name ?? '-'}</td>
                  <td>{t.qualification ?? '-'}</td>
                  <td>{fmtDate(t.join_date)}</td>
                  <td>{t.required_shifts_per_week ?? '-'}</td>
                  <td>{fmtMoney(t.price_per_shift)}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(t)}>
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

      <Modal title={editing ? 'Edit Teacher' : 'New Teacher'} open={open} onClose={() => setOpen(false)} wide>
        {form ? (
          <form onSubmit={submit} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="User account" required error={fieldError(formError, 'user_id')}>
                <Select value={form.user_id} onChange={(e) => set('user_id', e.target.value)} required>
                  {teacherUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department" required error={fieldError(formError, 'department_id')}>
                <Select value={form.department_id} onChange={(e) => set('department_id', e.target.value)} required>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Qualification" error={fieldError(formError, 'qualification')}>
                <Input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} />
              </Field>
              <Field label="Join date" required error={fieldError(formError, 'join_date')}>
                <Input type="date" value={form.join_date} onChange={(e) => set('join_date', e.target.value)} required />
              </Field>
              <Field label="Required shifts per week" error={fieldError(formError, 'required_shifts_per_week')}>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.required_shifts_per_week}
                  onChange={(e) => set('required_shifts_per_week', e.target.value)}
                />
              </Field>
              <Field label="Price per shift" error={fieldError(formError, 'price_per_shift')}>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price_per_shift}
                  onChange={(e) => set('price_per_shift', e.target.value)}
                />
              </Field>
              <Field label="Notes" error={fieldError(formError, 'notes')}>
                <TextArea rows={2} value="" readOnly placeholder="Contact info is managed under the user account." />
              </Field>
            </div>
            <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}