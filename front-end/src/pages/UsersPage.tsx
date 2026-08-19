import { useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { usePaged, Badge, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, TextArea, useToast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { Role, User } from '../lib/types';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  role: 'student' as Role,
  status: 'active',
  password: '',
  password_confirmation: '',
};

export default function UsersPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<User>('/users');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address ?? '',
      role: user.role,
      status: user.status,
      password: '',
      password_confirmation: '',
    });
    setFormError(null);
    setOpen(true);
  };

  const set = (key: keyof typeof emptyForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (editing && !payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }
      if (editing) {
        await patch<User>(`/users/${editing.id}`, payload);
        toast('User updated');
      } else {
        await post<User>('/users', payload);
        toast('User created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (user: User) => {
    if (!window.confirm(`Delete user "${user.full_name}"? This cannot be undone.`)) return;
    try {
      await del(`/users/${user.id}`);
      toast('User deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Users</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New User
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
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <Badge tone={user.role === 'admin' ? 'violet' : user.role === 'teacher' ? 'blue' : 'gray'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td>{user.status}</td>
                  <td>{fmtDate(user.created_at)}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(user)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(user)}>
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

      <Modal
        title={editing ? 'Edit User' : 'New User'}
        open={open}
        onClose={() => setOpen(false)}
        wide
      >
        <form onSubmit={submit} noValidate>
          {formError ? <ErrorBox message={formError} /> : null}
          <div className="form-grid">
            <Field label="First name" required error={fieldError(formError, 'first_name')}>
              <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
            </Field>
            <Field label="Last name" required error={fieldError(formError, 'last_name')}>
              <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
            </Field>
            <Field label="Email" required error={fieldError(formError, 'email')}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </Field>
            <Field label="Phone" required error={fieldError(formError, 'phone')}>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
            </Field>
            <Field label="Role" required error={fieldError(formError, 'role')}>
              <Select value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="student">student</option>
                <option value="teacher">teacher</option>
                <option value="admin">admin</option>
              </Select>
            </Field>
            <Field label="Status" error={fieldError(formError, 'status')}>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </Select>
            </Field>
            <Field label="Address" error={fieldError(formError, 'address')}>
              <TextArea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field
              label={editing ? 'New password (leave blank to keep)' : 'Password'}
              required={!editing}
              error={fieldError(formError, 'password')}
            >
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={editing ? '••••••••' : 'Min 8 chars, letters + numbers'}
                required={!editing}
              />
            </Field>
            <Field label="Confirm password" required={!editing} error={fieldError(formError, 'password_confirmation')}>
              <Input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => set('password_confirmation', e.target.value)}
                required={!editing}
              />
            </Field>
          </div>
          <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </div>
  );
}