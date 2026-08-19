import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOne } from '../lib/api';
import { ErrorBox, PageLoader, StatCard, StatusBadge } from '../components/ui';
import { fmtDate, fmtPct } from '../lib/format';
import type { FinalResult } from '../lib/types';

export default function FinalResultDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [result, setResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    getOne<FinalResult>(`/final-results/${studentId}`)
      .then((res) => setResult(res.data))
      .catch((err) => setError((err as Error).message ?? 'Failed to load result.'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <PageLoader />;
  if (error || !result) return <ErrorBox message={error ?? 'No result found.'} />;

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Final Result</h2>
        <Link className="btn btn-ghost" to="/final-results">
          &larr; Back
        </Link>
      </div>

      <div className="result-card">
        <div className="result-card-head">
          <div>
            <h3>{result.student.name}</h3>
            <p>
              {result.student.grade_level ?? '-'} &middot; {result.student.class ?? '-'} &middot;{' '}
              {result.academic_year.name ?? '-'}
            </p>
          </div>
          <div className={`grade-orb ${result.passed ? 'passed' : 'failed'}`}>{result.grade_letter}</div>
        </div>
        <div className="result-stats">
          <StatCard label="Overall" value={fmtPct(result.overall_percentage)} />
          <StatCard label="Pass mark" value={`${result.pass_mark}%`} />
          <StatCard label="Status" value={<StatusBadge status={result.passed ? 'passed' : 'failed'} />} />
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Subjects</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Exams</th>
              <th>Average</th>
            </tr>
          </thead>
          <tbody>
            {result.subjects.map((s) => (
              <tr key={s.subject}>
                <td>{s.subject}</td>
                <td>{s.exams_count}</td>
                <td>{fmtPct(s.percentage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.subjects.length === 0 ? <div className="empty-state">No subjects with published results.</div> : null}
      </div>

      <div className="card">
        <h3 className="card-title">Exam Breakdown</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Score</th>
              <th>%</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {result.exams.map((e) => (
              <tr key={e.exam_id}>
                <td>{e.exam_name}</td>
                <td>{e.exam_type}</td>
                <td>{e.subject}</td>
                <td>{fmtDate(e.exam_date)}</td>
                <td>
                  {e.score} / {e.max_grade}
                </td>
                <td>{fmtPct(e.percentage)}</td>
                <td>
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.exams.length === 0 ? <div className="empty-state">No exam results recorded yet.</div> : null}
      </div>
    </div>
  );
}