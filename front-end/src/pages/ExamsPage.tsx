import { useEffect, useState } from 'react';
import { del, errorMessage, fieldError, patch, post } from '../lib/api';
import { loadAcademicYears, loadClasses, loadDepartments, loadGradeLevels } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, StatusBadge, useToast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { AcademicYear, Department, Exam, ExamType, GradeLevel, SchoolClass } from '../lib/types';

interface FormState {
  exam_type: ExamType;
  name: string;
  subject: string;
  class_id: string;
  grade_level_id: string;
  academic_year_id: string;
  department_id: string;
  exam_date: string;
  max_grade: string;
}

export default function ExamsPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<Exam>('/exams');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, g, y, d] = await Promise.all([
          loadClasses(),
          loadGradeLevels(),
          loadAcademicYears(),
          loadDepartments(),
        ]);
        setClasses(c);
        setGradeLevels(g);
        setYears(y);
        setDepartments(d);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  const defaultForm = (): FormState => ({
    exam_type: 'quiz',
    name: '',
    subject: '',
    class_id: '',
    grade_level_id: gradeLevels[0]?.id ?? '',
    academic_year_id: years.find((y) => y.is_current)?.id ?? years[0]?.id ?? '',
    department_id: departments[0]?.id ?? '',
    exam_date: new Date().toISOString().slice(0, 10),
    max_grade: '100',
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (e: Exam) => {
    setEditing(e);
    setForm({
      exam_type: e.exam_type,
      name: e.name,
      subject: e.subject,
      class_id: e.class_id ?? '',
      grade_level_id: e.grade_level_id,
      academic_year_id: e.academic_year_id,
      department_id: e.department_id ?? '',
      exam_date: e.exam_date?.slice(0, 10) ?? '',
      max_grade: e.max_grade,
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
        class_id: form.class_id === '' ? null : form.class_id,
        department_id: form.department_id === '' ? null : form.department_id,
        max_grade: Number(form.max_grade),
      };
      if (editing) {
        await patch<Exam>(`/exams/${editing.id}`, payload);
        toast('Exam updated');
      } else {
        await post<Exam>('/exams', payload);
        toast('Exam created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const publish = async (e: Exam) => {
    if (!window.confirm(`Publish "${e.name}"? Students will be able to see it and it counts toward final results.`)) return;
    try {
      await post<Exam>(`/exams/${e.id}/publish`);
      toast('Exam published');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  const remove = async (e: Exam) => {
    if (!window.confirm(`Delete exam "${e.name}"? Its results will be deleted too.`)) return;
    try {
      await del(`/exams/${e.id}`);
      toast('Exam deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Exams</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Exam
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
                <th>Type</th>
                <th>Subject</th>
                <th>Grade Level</th>
                <th>Date</th>
                <th>Max</th>
                <th>Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.exam_type}</td>
                  <td>{e.subject}</td>
                  <td>{e.grade_level?.name ?? '-'}</td>
                  <td>{fmtDate(e.exam_date)}</td>
                  <td>{e.max_grade}</td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="td-actions">
                    {e.status === 'draft' ? (
                      <button className="btn btn-sm btn-primary" onClick={() => publish(e)}>
                        Publish
                      </button>
                    ) : null}
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(e)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(e)}>
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

      <Modal title={editing ? 'Edit Exam' : 'New Exam'} open={open} onClose={() => setOpen(false)} wide>
        {form ? (
          <form onSubmit={submit} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="Type" required error={fieldError(formError, 'exam_type')}>
                <Select value={form.exam_type} onChange={(e) => set('exam_type', e.target.value)} required>
                  <option value="quiz">quiz</option>
                  <option value="midterm">midterm</option>
                  <option value="final">final</option>
                </Select>
              </Field>
              <Field label="Name" required error={fieldError(formError, 'name')}>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Grade 1 Midterm Exam - Math" required />
              </Field>
              <Field label="Subject" required error={fieldError(formError, 'subject')}>
                <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} required />
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
              <Field label="Class (empty = whole grade level)" error={fieldError(formError, 'class_id')}>
                <Select value={form.class_id} onChange={(e) => set('class_id', e.target.value)}>
                  <option value="">-- All classes --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Exam date" required error={fieldError(formError, 'exam_date')}>
                <Input type="date" value={form.exam_date} onChange={(e) => set('exam_date', e.target.value)} required />
              </Field>
              <Field label="Max grade" required error={fieldError(formError, 'max_grade')}>
                <Input
                  type="number"
                  step="0.01"
                  min={1}
                  value={form.max_grade}
                  onChange={(e) => set('max_grade', e.target.value)}
                  required
                />
              </Field>
            </div>
            <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}