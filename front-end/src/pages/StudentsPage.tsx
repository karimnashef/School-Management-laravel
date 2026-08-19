import { useEffect, useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { loadAcademicYears, loadClasses, loadGradeLevels, loadUsers } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, useToast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { AcademicYear, GradeLevel, SchoolClass, Student, User } from '../lib/types';

interface FormState {
  user_id: string;
  class_id: string;
  grade_level_id: string;
  academic_year_id: string;
  admission_date: string;
  age: string;
  blood_group: string;
}

export default function StudentsPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<Student>('/students');
  const [studentUsers, setStudentUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, c, g, y] = await Promise.all([
          loadUsers('student'),
          loadClasses(),
          loadGradeLevels(),
          loadAcademicYears(),
        ]);
        setStudentUsers(u);
        setClasses(c);
        setGradeLevels(g);
        setYears(y);
      } catch {
        // refs are optional for viewing
      }
    })();
  }, []);

  const defaultForm = (): FormState => ({
    user_id: studentUsers[0]?.id ?? '',
    class_id: classes[0]?.id ?? '',
    grade_level_id: gradeLevels[0]?.id ?? '',
    academic_year_id: years.find((y) => y.is_current)?.id ?? years[0]?.id ?? '',
    admission_date: new Date().toISOString().slice(0, 10),
    age: '',
    blood_group: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      user_id: s.user_id,
      class_id: s.class_id,
      grade_level_id: s.grade_level_id,
      academic_year_id: s.academic_year_id,
      admission_date: s.admission_date?.slice(0, 10) ?? '',
      age: s.age?.toString() ?? '',
      blood_group: s.blood_group ?? '',
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
        age: form.age === '' ? null : Number(form.age),
        blood_group: form.blood_group === '' ? null : form.blood_group,
      };
      if (editing) {
        await patch<Student>(`/students/${editing.id}`, payload);
        toast('Student updated');
      } else {
        await post<Student>('/students', payload);
        toast('Student created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (s: Student) => {
    if (!window.confirm(`Delete student record for "${s.user?.full_name}"?`)) return;
    try {
      await del(`/students/${s.id}`);
      toast('Student deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Students</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Student
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
                <th>Class</th>
                <th>Grade Level</th>
                <th>Year</th>
                <th>Admission</th>
                <th>Age</th>
                <th>Blood</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.user?.full_name ?? '-'}</td>
                  <td>{s.class?.name ?? '-'}</td>
                  <td>{s.grade_level?.name ?? '-'}</td>
                  <td>{s.academic_year?.name ?? '-'}</td>
                  <td>{fmtDate(s.admission_date)}</td>
                  <td>{s.age ?? '-'}</td>
                  <td>{s.blood_group ?? '-'}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(s)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>
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

      <Modal title={editing ? 'Edit Student' : 'New Student'} open={open} onClose={() => setOpen(false)} wide>
        {form ? (
          <form onSubmit={submit} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="User account" required error={fieldError(formError, 'user_id')}>
                <Select value={form.user_id} onChange={(e) => set('user_id', e.target.value)} required>
                  {studentUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Class" required error={fieldError(formError, 'class_id')}>
                <Select value={form.class_id} onChange={(e) => set('class_id', e.target.value)} required>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade_level?.name ?? '-'})
                    </option>
                  ))}
                </Select>
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
              <Field label="Admission date" required error={fieldError(formError, 'admission_date')}>
                <Input
                  type="date"
                  value={form.admission_date}
                  onChange={(e) => set('admission_date', e.target.value)}
                  required
                />
              </Field>
              <Field label="Age" error={fieldError(formError, 'age')}>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => set('age', e.target.value)}
                />
              </Field>
              <Field label="Blood group" error={fieldError(formError, 'blood_group')}>
                <Select value={form.blood_group} onChange={(e) => set('blood_group', e.target.value)}>
                  <option value="">-- None --</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}