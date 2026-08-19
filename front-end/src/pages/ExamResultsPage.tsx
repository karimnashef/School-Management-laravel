import { useEffect, useMemo, useState } from 'react';
import { del, errorMessage, fieldError, post } from '../lib/api';
import { loadExams, loadStudents } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, StatusBadge, TextArea, useToast } from '../components/ui';
import { fmtDate, fmtPct } from '../lib/format';
import type { Exam, ExamResult, Student } from '../lib/types';

interface FormState {
  exam_id: string;
  student_id: string;
  score: string;
  remarks: string;
}

export default function ExamResultsPage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<ExamResult>('/exam-results');
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [bulkExamId, setBulkExamId] = useState('');
  const [bulkScores, setBulkScores] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [e, s] = await Promise.all([loadExams(), loadStudents()]);
        setExams(e);
        setStudents(s);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  const openCreate = () => {
    setForm({
      exam_id: exams[0]?.id ?? '',
      student_id: students[0]?.id ?? '',
      score: '',
      remarks: '',
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
      await post<ExamResult>('/exam-results', {
        ...form,
        score: Number(form.score),
        remarks: form.remarks === '' ? null : form.remarks,
      });
      toast('Result recorded');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openBulk = () => {
    setBulkExamId(exams[0]?.id ?? '');
    setBulkScores({});
    setFormError(null);
    setBulkOpen(true);
  };

  const selectedExam = useMemo(() => exams.find((e) => e.id === bulkExamId), [exams, bulkExamId]);

  const eligibleStudents = useMemo(() => {
    if (!selectedExam) return students;
    return students.filter(
      (s) =>
        s.grade_level_id === selectedExam.grade_level_id &&
        (selectedExam.class_id === null || s.class_id === selectedExam.class_id)
    );
  }, [students, selectedExam]);

  const submitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const records = eligibleStudents
        .filter((s) => bulkScores[s.id] !== undefined && bulkScores[s.id] !== '')
        .map((s) => ({ student_id: s.id, score: Number(bulkScores[s.id]) }));
      await post<ExamResult[]>('/exam-results/bulk', {
        exam_id: bulkExamId,
        records,
      });
      toast(`${records.length} result(s) saved`);
      setBulkOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (r: ExamResult) => {
    if (!window.confirm(`Delete result for "${r.student?.user?.full_name}"?`)) return;
    try {
      await del(`/exam-results/${r.id}`);
      toast('Result deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Exam Results</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openBulk}>
            Bulk entry
          </button>
          <button className="btn btn-ghost" onClick={openCreate}>
            + Single result
          </button>
        </div>
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
                <th>Exam</th>
                <th>Score</th>
                <th>%</th>
                <th>Status</th>
                <th>Date</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.student?.user?.full_name ?? '-'}</td>
                  <td>{r.exam?.name ?? '-'}</td>
                  <td>
                    {r.score} / {r.exam?.max_grade ?? '-'}
                  </td>
                  <td>{fmtPct(r.percentage)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.exam ? fmtDate(r.exam.exam_date) : '-'}</td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-danger" onClick={() => remove(r)}>
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

      <Modal title="Record Result" open={open} onClose={() => setOpen(false)} wide>
        {form ? (
          <form onSubmit={submit} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="Exam" required error={fieldError(formError, 'exam_id')}>
                <Select value={form.exam_id} onChange={(e) => set('exam_id', e.target.value)} required>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} (max {e.max_grade})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Student" required error={fieldError(formError, 'student_id')}>
                <Select value={form.student_id} onChange={(e) => set('student_id', e.target.value)} required>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.full_name ?? s.id}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Score" required error={fieldError(formError, 'score')}>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.score}
                  onChange={(e) => set('score', e.target.value)}
                  required
                />
              </Field>
              <Field label="Remarks" error={fieldError(formError, 'remarks')}>
                <TextArea rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
              </Field>
            </div>
            <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
          </form>
        ) : null}
      </Modal>

      <Modal title="Bulk Exam Results" open={bulkOpen} onClose={() => setBulkOpen(false)} wide>
        <form onSubmit={submitBulk} noValidate>
          {formError ? <ErrorBox message={formError} /> : null}
          <Field label="Exam" required>
            <Select value={bulkExamId} onChange={(e) => setBulkExamId(e.target.value)} required>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} (max {e.max_grade})
                </option>
              ))}
            </Select>
          </Field>
          <div className="bulk-list">
            <div className="bulk-list-head">
              <span>Student</span>
              <span>Score</span>
            </div>
            {eligibleStudents.length === 0 ? (
              <div className="empty-state">No students match this exam's grade level / class.</div>
            ) : (
              eligibleStudents.map((s) => (
                <div className="bulk-row" key={s.id}>
                  <span>{s.user?.full_name ?? s.id}</span>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="score"
                    value={bulkScores[s.id] ?? ''}
                    onChange={(e) => setBulkScores((r) => ({ ...r, [s.id]: e.target.value }))}
                  />
                </div>
              ))
            )}
          </div>
          <FormActions submitting={submitting} onCancel={() => setBulkOpen(false)} />
        </form>
      </Modal>
    </div>
  );
}