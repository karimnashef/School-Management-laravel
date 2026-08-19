import { useEffect, useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { loadAcademicYears, loadDepartments, loadGradeLevels, loadStudents } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, TextArea, useToast } from '../components/ui';
import { fmtPct } from '../lib/format';
import type { AcademicYear, Department, Grade, GradeLevel, Student } from '../lib/types';

interface FormState {
  student_id: string;
  department_id: string;
  academic_year_id: string;
  grade_level_id: string;
  name: string;
  grade: string;
  result: string;
  description: string;
}

export default function GradesPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<Grade>('/grades');
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, d, y, g] = await Promise.all([
          loadStudents(),
          loadDepartments(),
          loadAcademicYears(),
          loadGradeLevels(),
        ]);
        setStudents(s);
        setDepartments(d);
        setYears(y);
        setGradeLevels(g);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  const defaultForm = (): FormState => ({
    student_id: students[0]?.id ?? '',
    department_id: departments[0]?.id ?? '',
    academic_year_id: years.find((y) => y.is_current)?.id ?? years[0]?.id ?? '',
    grade_level_id: gradeLevels[0]?.id ?? '',
    name: departments[0]?.name ?? '',
    grade: '',
    result: '',
    description: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (g: Grade) => {
    setEditing(g);
    setForm({
      student_id: g.student_id,
      department_id: g.department_id ?? '',
      academic_year_id: g.academic_year_id,
      grade_level_id: g.grade_level_id,
      name: g.name,
      grade: g.grade.toString(),
      result: g.result ?? '',
      description: g.description ?? '',
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
        grade: Number(form.grade),
        department_id: form.department_id === '' ? null : form.department_id,
        result: form.result === '' ? null : form.result,
        description: form.description === '' ? null : form.description,
      };
      if (editing) {
        await patch<Grade>(`/grades/${editing.id}`, payload);
        toast('Grade updated');
      } else {
        await post<Grade>('/grades', payload);
        toast('Grade recorded');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (g: Grade) => {
    if (!window.confirm(`Delete grade record for "${g.name}"?`)) return;
    try {
      await del(`/grades/${g.id}`);
      toast('Grade deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Grades</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + Record Grade
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
                <th>Student</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>%</th>
                <th>Result</th>
                <th>Year</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>{g.student?.user?.full_name ?? '-'}</td>
                  <td>{g.name}</td>
                  <td>{g.grade}</td>
                  <td>{fmtPct(g.percentage)}</td>
                  <td>{g.result ?? '-'}</td>
                  <td>{g.academic_year?.name ?? '-'}</td>
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

      <Modal title={editing ? 'Edit Grade' : 'Record Grade'} open={open} onClose={() => setOpen(false)} wide>
        {form ? (
          <form onSubmit={submit} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="Student" required error={fieldError(formError, 'student_id')}>
                <Select value={form.student_id} onChange={(e) => set('student_id', e.target.value)} required>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.full_name ?? s.id}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department" error={fieldError(formError, 'department_id')}>
                <Select value={form.department_id} onChange={(e) => set('department_id', e.target.value)}>
                  <option value="">-- None --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject name" required error={fieldError(formError, 'name')}>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </Field>
              <Field label="Grade" required error={fieldError(formError, 'grade')}>
                <Input
                  type="number"
                  min={0}
                  value={form.grade}
                  onChange={(e) => set('grade', e.target.value)}
                  required
                />
              </Field>
              <Field label="Result" error={fieldError(formError, 'result')}>
                <Input value={form.result} onChange={(e) => set('result', e.target.value)} />
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