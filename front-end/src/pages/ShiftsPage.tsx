import { useEffect, useMemo, useState } from 'react';
import { del, errorMessage, fieldError, getList, patch, post } from '../lib/api';
import { loadClasses, loadTeachers } from '../lib/refs';
import { ErrorBox, Field, FormActions, Input, Modal, PageLoader, Select, StatusBadge, TextArea, useToast } from '../components/ui';
import { fmtDate, fmtTime } from '../lib/format';
import type { SchoolClass, Teacher, TeacherShift } from '../lib/types';

interface ShiftForm {
  teacher_id: string;
  class_id: string;
  switch_to_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
}

interface GenerateForm {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  class_ids: string[];
  teacher_ids: string[];
  days_of_week: number[];
  replace_existing: boolean;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (s.getDay() + 6) % 7;
  s.setDate(s.getDate() - shift);
  return s;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function fmtKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function SchedulePage() {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [shifts, setShifts] = useState<TeacherShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const [shiftOpen, setShiftOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherShift | null>(null);
  const [form, setForm] = useState<ShiftForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState<GenerateForm | null>(null);
  const [genSubmitting, setGenSubmitting] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const fromDate = fmtKey(days[0]);
  const toDate = fmtKey(days[6]);

  useEffect(() => {
    (async () => {
      try {
        const [t, c] = await Promise.all([loadTeachers(), loadClasses()]);
        setTeachers(t);
        setClasses(c);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getList<TeacherShift>('/teacher-shifts', {
      per_page: 100,
      from_date: fromDate,
      to_date: toDate,
      ...(classFilter ? { class_id: classFilter } : {}),
      ...(teacherFilter ? { teacher_id: teacherFilter } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        setShifts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setShifts([]);
        setLoading(false);
        setError(err?.response?.data?.message ?? 'Failed to load schedule.');
      });
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, classFilter, teacherFilter, tick]);

  const byDay = useMemo(() => {
    const map = new Map<string, TeacherShift[]>();
    for (const d of days) map.set(fmtKey(d), []);
    for (const s of shifts) {
      const key = s.shift_date?.slice(0, 10);
      if (key && map.has(key)) map.get(key)!.push(s);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
    }
    return map;
  }, [shifts, days]);

  const weekLabel = `${fmtDate(fromDate)} - ${fmtDate(toDate)}`;

  const openCreate = (date?: Date) => {
    setEditing(null);
    setForm({
      teacher_id: teachers[0]?.id ?? '',
      class_id: classes[0]?.id ?? '',
      switch_to_id: '',
      shift_date: fmtKey(date ?? new Date()),
      start_time: '08:00',
      end_time: '10:00',
      status: 'scheduled',
      notes: '',
    });
    setFormError(null);
    setShiftOpen(true);
  };

  const openEdit = (s: TeacherShift) => {
    setEditing(s);
    setForm({
      teacher_id: s.teacher_id,
      class_id: s.class_id,
      switch_to_id: s.switch_to_id ?? '',
      shift_date: s.shift_date?.slice(0, 10) ?? '',
      start_time: s.start_time?.slice(0, 5) ?? '',
      end_time: s.end_time?.slice(0, 5) ?? '',
      status: s.status,
      notes: s.notes ?? '',
    });
    setFormError(null);
    setShiftOpen(true);
  };

  const set = (key: keyof ShiftForm, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const submitShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        switch_to_id: form.switch_to_id === '' ? null : form.switch_to_id,
        notes: form.notes === '' ? null : form.notes,
      };
      if (editing) {
        await patch<TeacherShift>(`/teacher-shifts/${editing.id}`, payload);
        toast('Shift updated');
      } else {
        await post<TeacherShift>('/teacher-shifts', payload);
        toast('Shift created');
      }
      setShiftOpen(false);
      setTick((t) => t + 1);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (s: TeacherShift) => {
    if (!window.confirm(`Delete this shift (${fmtDate(s.shift_date)})?`)) return;
    try {
      await del(`/teacher-shifts/${s.id}`);
      toast('Shift deleted', 'red');
      setTick((t) => t + 1);
    } catch (err) {
      toast(errorMessage(err), 'red');
    }
  };

  const openGenerate = () => {
    setGenForm({
      start_date: fmtKey(weekStart),
      end_date: fmtKey(addDays(weekStart, 6)),
      start_time: '08:00',
      end_time: '10:00',
      class_ids: classes.map((c) => c.id),
      teacher_ids: [],
      days_of_week: [1, 2, 3, 4, 5],
      replace_existing: false,
    });
    setGenError(null);
    setGenerateOpen(true);
  };

  const toggleGen = (key: 'class_ids' | 'teacher_ids', id: string) =>
    setGenForm((f) => {
      if (!f) return f;
      const has = f[key].includes(id);
      return { ...f, [key]: has ? f[key].filter((x) => x !== id) : [...f[key], id] };
    });

  const toggleDay = (d: number) =>
    setGenForm((f) => {
      if (!f) return f;
      const has = f.days_of_week.includes(d);
      return { ...f, days_of_week: has ? f.days_of_week.filter((x) => x !== d) : [...f.days_of_week, d] };
    });

  const submitGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genForm) return;
    setGenSubmitting(true);
    setGenError(null);
    try {
      const res = await post<TeacherShift[]>('/teacher-shifts/generate', {
        start_date: genForm.start_date,
        end_date: genForm.end_date,
        start_time: genForm.start_time,
        end_time: genForm.end_time,
        class_ids: genForm.class_ids,
        teacher_ids: genForm.teacher_ids.length > 0 ? genForm.teacher_ids : null,
        days_of_week: genForm.days_of_week,
        replace_existing: genForm.replace_existing,
      });
      toast(`${res.data.length} shifts generated`);
      setGenerateOpen(false);
      setTick((t) => t + 1);
    } catch (err) {
      setGenError(errorMessage(err));
    } finally {
      setGenSubmitting(false);
    }
  };

  const today = fmtKey(new Date());

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Weekly Schedule</h2>
        <div className="btn-group">
          <button className="btn btn-ghost" onClick={openGenerate}>
            Generate Schedule
          </button>
          <button className="btn btn-primary" onClick={() => openCreate()}>
            + New Shift
          </button>
        </div>
      </div>

      <div className="schedule-toolbar card">
        <div className="btn-group">
          <button className="btn btn-ghost" onClick={() => setWeekStart((w) => addDays(w, -7))}>
            &lsaquo; Prev
          </button>
          <button className="btn btn-ghost" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </button>
          <button className="btn btn-ghost" onClick={() => setWeekStart((w) => addDays(w, 7))}>
            Next &rsaquo;
          </button>
        </div>
        <span className="schedule-week-label">{weekLabel}</span>
        <div className="schedule-filters">
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user?.full_name ?? t.id}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="schedule-scroll">
          <div className="schedule-grid card">
          {days.map((d) => {
            const key = fmtKey(d);
            const dayShifts = byDay.get(key) ?? [];
            const isToday = key === today;
            return (
              <div key={key} className={`schedule-col ${isToday ? 'schedule-today' : ''}`}>
                <div className="schedule-day-head">
                  <div className="schedule-day-name">{DAY_NAMES[(d.getDay() + 6) % 7]}</div>
                  <div className="schedule-day-date">{d.getDate()}</div>
                </div>
                <div className="schedule-day-body">
                  {dayShifts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`schedule-card ${s.status === 'cancelled' ? 'schedule-card-cancelled' : ''}`}
                      onClick={() => openEdit(s)}
                    >
                      <div className="schedule-card-time">
                        {fmtTime(s.start_time)} - {fmtTime(s.end_time)}
                      </div>
                      <div className="schedule-card-class">{s.class?.name ?? '-'}</div>
                      <div className="schedule-card-teacher">{s.teacher?.user?.full_name ?? '-'}</div>
                      <div className="schedule-card-status">
                        <StatusBadge status={s.status} />
                        {s.switch_to ? <span className="schedule-card-sub">sub: {s.switch_to.user?.full_name}</span> : null}
                      </div>
                    </button>
                  ))}
                  <button type="button" className="schedule-add" onClick={() => openCreate(d)}>
                    + Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      <Modal title={editing ? 'Edit Shift' : 'New Shift'} open={shiftOpen} onClose={() => setShiftOpen(false)} wide>
        {form ? (
          <form onSubmit={submitShift} noValidate>
            {formError ? <ErrorBox message={formError} /> : null}
            <div className="form-grid">
              <Field label="Teacher" required error={fieldError(formError, 'teacher_id')}>
                <Select value={form.teacher_id} onChange={(e) => set('teacher_id', e.target.value)} required>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.full_name ?? t.id}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Class" required error={fieldError(formError, 'class_id')}>
                <Select value={form.class_id} onChange={(e) => set('class_id', e.target.value)} required>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Substitute teacher" error={fieldError(formError, 'switch_to_id')}>
                <Select value={form.switch_to_id} onChange={(e) => set('switch_to_id', e.target.value)}>
                  <option value="">-- None --</option>
                  {teachers
                    .filter((t) => t.id !== form.teacher_id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.user?.full_name ?? t.id}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Date" required error={fieldError(formError, 'shift_date')}>
                <Input type="date" value={form.shift_date} onChange={(e) => set('shift_date', e.target.value)} required />
              </Field>
              <Field label="Start time" required error={fieldError(formError, 'start_time')}>
                <Input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} required />
              </Field>
              <Field label="End time" required error={fieldError(formError, 'end_time')}>
                <Input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} required />
              </Field>
              <Field label="Status" error={fieldError(formError, 'status')}>
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="scheduled">scheduled</option>
                  <option value="completed">completed</option>
                  <option value="absent">absent</option>
                  <option value="cancelled">cancelled</option>
                </Select>
              </Field>
              <Field label="Notes" error={fieldError(formError, 'notes')}>
                <TextArea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </div>
            <div className="form-actions">
              {editing ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={submitting}
                  onClick={() => {
                    setShiftOpen(false);
                    remove(editing);
                  }}
                >
                  Delete
                </button>
              ) : null}
              <div className="btn-group">
                <button type="button" className="btn btn-ghost" onClick={() => setShiftOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal title="Generate Schedule" open={generateOpen} onClose={() => setGenerateOpen(false)} wide>
        {genForm ? (
          <form onSubmit={submitGenerate} noValidate>
            {genError ? <ErrorBox message={genError} /> : null}
            <div className="form-grid">
              <Field label="Start date" required>
                <Input
                  type="date"
                  value={genForm.start_date}
                  onChange={(e) => setGenForm((f) => (f ? { ...f, start_date: e.target.value } : f))}
                  required
                />
              </Field>
              <Field label="End date" required>
                <Input
                  type="date"
                  value={genForm.end_date}
                  onChange={(e) => setGenForm((f) => (f ? { ...f, end_date: e.target.value } : f))}
                  required
                />
              </Field>
              <Field label="Start time" required>
                <Input
                  type="time"
                  value={genForm.start_time}
                  onChange={(e) => setGenForm((f) => (f ? { ...f, start_time: e.target.value } : f))}
                  required
                />
              </Field>
              <Field label="End time" required>
                <Input
                  type="time"
                  value={genForm.end_time}
                  onChange={(e) => setGenForm((f) => (f ? { ...f, end_time: e.target.value } : f))}
                  required
                />
              </Field>
              <Field label="Working days">
                <div className="check-row">
                  {WEEKDAYS.map((d) => (
                    <label key={d.value} className="check-item">
                      <input
                        type="checkbox"
                        checked={genForm.days_of_week.includes(d.value)}
                        onChange={() => toggleDay(d.value)}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Replace existing shifts in range">
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={genForm.replace_existing}
                    onChange={(e) => setGenForm((f) => (f ? { ...f, replace_existing: e.target.checked } : f))}
                  />
                  Replace
                </label>
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Classes" required>
                <div className="check-list">
                  {classes.map((c) => (
                    <label key={c.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={genForm.class_ids.includes(c.id)}
                        onChange={() => toggleGen('class_ids', c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                  {classes.length === 0 ? <span className="muted">No classes available.</span> : null}
                </div>
              </Field>
              <Field label="Teachers (empty = all)">
                <div className="check-list">
                  {teachers.map((t) => (
                    <label key={t.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={genForm.teacher_ids.includes(t.id)}
                        onChange={() => toggleGen('teacher_ids', t.id)}
                      />
                      {t.user?.full_name ?? t.id}
                    </label>
                  ))}
                  {teachers.length === 0 ? <span className="muted">No teachers available.</span> : null}
                </div>
              </Field>
            </div>
            <FormActions submitting={genSubmitting} onCancel={() => setGenerateOpen(false)} />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}