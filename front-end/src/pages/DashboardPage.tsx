import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getList, getOne } from '../lib/api';
import { ErrorBox, PageLoader, StatCard, StatusBadge } from '../components/ui';
import { fmtDate, fmtPct } from '../lib/format';
import type { Attendance, Exam, FinalResult, Student, TeacherShift } from '../lib/types';

interface Counts {
  students: number;
  teachers: number;
  classes: number;
  exams: number;
  departments: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<FinalResult[]>([]);
  const [ownResult, setOwnResult] = useState<FinalResult | null>(null);
  const [shifts, setShifts] = useState<TeacherShift[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        if (user?.role === 'student') {
          const ownId = user.student?.id;
          if (ownId) {
            const res = await getOne<FinalResult>(`/final-results/${ownId}`);
            if (!cancelled) setOwnResult(res.data);
          }
        } else {
          const [s, t, c, e, d] = await Promise.all([
            getList<Student>('/students', { per_page: 1 }),
            getList<Student>('/teachers', { per_page: 1 }),
            getList<Student>('/school-classes', { per_page: 1 }),
            getList<Exam>('/exams', { per_page: 1 }),
            getList<Student>('/departments', { per_page: 1 }),
          ]);
          if (cancelled) return;
          setCounts({
            students: s.meta.total,
            teachers: t.meta.total,
            classes: c.meta.total,
            exams: e.meta.total,
            departments: d.meta.total,
          });
          const [ex, rs, sh, at] = await Promise.all([
            getList<Exam>('/exams', { per_page: 5 }),
            getList<FinalResult>('/final-results', { per_page: 5 }),
            getList<TeacherShift>('/teacher-shifts', { per_page: 5 }),
            getList<Attendance>('/attendances', { per_page: 5 }),
          ]);
          if (cancelled) return;
          setExams(ex.data);
          setResults(rs.data);
          setShifts(sh.data);
          setAttendance(at.data);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <PageLoader />;

  if (user?.role === 'student') {
    return (
      <div className="page">
        <h2 className="page-title">My Dashboard</h2>
        {error ? <ErrorBox message={error} /> : null}
        {ownResult ? (
          <div className="dashboard-grid">
            <div className="result-card">
              <div className="result-card-head">
                <div>
                  <h3>{ownResult.student.name}</h3>
                  <p>
                    {ownResult.student.grade_level ?? '-'} &middot; {ownResult.student.class ?? '-'}
                  </p>
                </div>
                <div className={`grade-orb ${ownResult.passed ? 'passed' : 'failed'}`}>
                  {ownResult.grade_letter}
                </div>
              </div>
              <div className="result-stats">
                <StatCard label="Overall" value={fmtPct(ownResult.overall_percentage)} />
                <StatCard
                  label="Status"
                  value={<StatusBadge status={ownResult.passed ? 'passed' : 'failed'} />}
                />
                <StatCard label="Academic Year" value={ownResult.academic_year.name ?? '-'} />
              </div>
              <Link className="btn btn-primary" to={`/final-results/${ownResult.student.id}`}>
                View full report
              </Link>
            </div>
          </div>
        ) : (
          <div className="empty-state">No final result published for you yet.</div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="page-title">Dashboard</h2>
      {error ? <ErrorBox message={error} /> : null}
      {counts ? (
        <div className="dashboard-grid">
          <StatCard label="Students" value={counts.students} />
          <StatCard label="Teachers" value={counts.teachers} />
          <StatCard label="Classes" value={counts.classes} />
          <StatCard label="Exams" value={counts.exams} />
          <StatCard label="Departments" value={counts.departments} />
        </div>
      ) : null}

      <div className="dashboard-cols">
        <div className="card">
          <h3 className="card-title">Recent Exams</h3>
          {exams.length === 0 ? (
            <div className="empty-state">No exams yet.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.name}</td>
                    <td>{exam.subject}</td>
                    <td>{fmtDate(exam.exam_date)}</td>
                    <td>
                      <StatusBadge status={exam.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Latest Final Results</h3>
          {results.length === 0 ? (
            <div className="empty-state">No final results yet.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Overall</th>
                  <th>Grade</th>
                  <th>Passed</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.student.id}>
                    <td>
                      <Link to={`/final-results/${r.student.id}`}>{r.student.name}</Link>
                    </td>
                    <td>{fmtPct(r.overall_percentage)}</td>
                    <td>
                      <span className={`grade-letter grade-${r.grade_letter.toLowerCase()}`}>
                        {r.grade_letter}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.passed ? 'passed' : 'failed'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="dashboard-cols">
        <div className="card">
          <h3 className="card-title">Recent Teacher Shifts</h3>
          {shifts.length === 0 ? (
            <div className="empty-state">No shifts yet.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td>{s.teacher?.user?.full_name ?? '-'}</td>
                    <td>{s.class?.name ?? '-'}</td>
                    <td>{fmtDate(s.shift_date)}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Recent Attendance</h3>
          {attendance.length === 0 ? (
            <div className="empty-state">No attendance records yet.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td>{a.student?.user?.full_name ?? '-'}</td>
                    <td>{fmtDate(a.attendance_date)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}