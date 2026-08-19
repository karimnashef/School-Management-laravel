import { useEffect, useMemo, useState } from 'react';
import { del, errorMessage, fieldError, post } from '../lib/api';
import { loadShifts, loadStudents } from '../lib/refs';
import { usePaged, ErrorBox, Field, FormActions, Input, Modal, PageLoader, Pagination, Select, StatusBadge, TextArea, useToast } from '../components/ui';
import { fmtDate } from '../lib/format';
import type { Attendance, AttendanceStatus, Student, TeacherShift } from '../lib/types';

interface FormState {
  student_id: string;
  shift_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string;
}

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export default function AttendancePage() {
  const { toast } = useToast();
  const { rows, meta, loading, error, reload, setPage } = usePaged<Attendance>('/attendances');
  const [shifts, setShifts] = useState<TeacherShift[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [bulkShiftId, setBulkShiftId] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));
  const [bulkRows, setBulkRows] = useState<Record<string, AttendanceStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, st] = await Promise.all([loadShifts(), loadStudents()]);
        setShifts(s);
        setStudents(st);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  const openCreate = () => {
    setForm({
      student_id: students[0]?.id ?? '',
      shift_id: shifts[0]?.id ?? '',
      attendance_date: new Date().toISOString().slice(0, 10),
      status: 'present',
      notes: '',
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
      await post<Attendance>('/attendances', {
        ...form,
        notes: form.notes === '' ? null : form.notes,
      });
      toast('Attendance recorded');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openBulk = () => {
    setBulkShiftId(shifts[0]?.id ?? '');
    setBulkDate(new Date().toISOString().slice(0, 10));
    setBulkRows({});
    setFormError(null);
    setBulkOpen(true);
  };

  const selectedShift = useMemo(() => shifts.find((s) => s.id === bulkShiftId), [shifts, bulkShiftId]);

  const classStudents = useMemo(() => {
    if (!selectedShift) return [];
    return students.filter((s) => s.class_id === selectedShift.class_id);
  }, [students, selectedShift]);

  const submitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const records = classStudents
        .filter((s) => bulkRows[s.id])
        .map((s) => ({ student_id: s.id, status: bulkRows[s.id] }));
      await post<Attendance[]>('/attendances/bulk', {
        shift_id: bulkShiftId,
        attendance_date: bulkDate,
        records,
      });
      toast(`${records.length} attendance record(s) saved`);
      setBulkOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (a: Attendance) => {
    if (!window.confirm(`Delete attendance for "${a.student?.user?.full_name}"?`)) return;
    try {
      await del(`/attendances/${a.id}`);
      toast('Attendance deleted', 'red');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Attendance</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openBulk}>
            Bulk mark
          </button>
          <button className="btn btn-ghost" onClick={openCreate}>
            + Single record
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
                <th>Shift</th>
                <th>Date</th>
                <th>Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.student?.user?.full_name ?? '-'}</td>
                  <td>
                    {a.shift
                      ? `${a.shift.class?.name ?? '-'} / ${fmtDate(a.shift.shift_date)}`
                      : '-'}
                  </td>
                  <td>{fmtDate(a.attendance_date)}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="td-actions">
                    <button className="btn btn-sm btn-danger" onClick={() => remove(a)}>
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

      <Modal title="Record Attendance" open={open} onClose={() => setOpen(false)} wide>
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
              <Field label="Shift" required error={fieldError(formError, 'shift_id')}>
                <Select value={form.shift_id} onChange={(e) => set('shift_id', e.target.value)} required>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name ?? '-'} / {fmtDate(s.shift_date)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date" required error={fieldError(formError, 'attendance_date')}>
                <Input
                  type="date"
                  value={form.attendance_date}
                  onChange={(e) => set('attendance_date', e.target.value)}
                  required
                />
              </Field>
              <Field label="Status" required error={fieldError(formError, 'status')}>
                <Select value={form.status} onChange={(e) => set('status', e.target.value)} required>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notes" error={fieldError(formError, 'notes')}>
                <TextArea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </div>
            <FormActions submitting={submitting} onCancel={() => setOpen(false)} />
          </form>
        ) : null}
      </Modal>

      <Modal title="Bulk Attendance" open={bulkOpen} onClose={() => setBulkOpen(false)} wide>
        <form onSubmit={submitBulk} noValidate>
          {formError ? <ErrorBox message={formError} /> : null}
          <div className="form-grid">
            <Field label="Shift" required>
              <Select value={bulkShiftId} onChange={(e) => setBulkShiftId(e.target.value)} required>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.class?.name ?? '-'} / {fmtDate(s.shift_date)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" required>
              <Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} required />
            </Field>
          </div>
          <div className="bulk-list">
            <div className="bulk-list-head">
              <span>Student</span>
              <span>Status</span>
            </div>
            {classStudents.length === 0 ? (
              <div className="empty-state">No students in this class.</div>
            ) : (
              classStudents.map((s) => (
                <div className="bulk-row" key={s.id}>
                  <span>{s.user?.full_name ?? s.id}</span>
                  <select
                    className="input"
                    value={bulkRows[s.id] ?? ''}
                    onChange={(e) => setBulkRows((r) => ({ ...r, [s.id]: e.target.value as AttendanceStatus }))}
                  >
                    <option value="" disabled>
                      -- select --
                    </option>
                    {statuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
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