import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAcademicYears, loadClasses } from '../lib/refs';
import { usePaged, Badge, ErrorBox, PageLoader, Pagination, Select } from '../components/ui';
import { fmtPct } from '../lib/format';
import type { AcademicYear, FinalResult, SchoolClass } from '../lib/types';

export default function FinalResultsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const { rows, meta, loading, error, reload, setPage } = usePaged<FinalResult>('/final-results', filters);

  useEffect(() => {
    (async () => {
      try {
        const [c, y] = await Promise.all([loadClasses(), loadAcademicYears()]);
        setClasses(c);
        setYears(y);
      } catch {
        // refs are optional
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
    const next: Record<string, unknown> = {};
    if (classFilter) next.class_id = classFilter;
    if (yearFilter) next.academic_year_id = yearFilter;
    setFilters(next);
  }, [classFilter, yearFilter, setPage]);

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Final Results</h2>
      </div>

      <div className="filters">
        <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </Select>
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
                <th>Class</th>
                <th>Grade Level</th>
                <th>Year</th>
                <th>Overall</th>
                <th>Grade</th>
                <th>Status</th>
                <th className="th-actions">Report</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id}>
                  <td>{r.student.name}</td>
                  <td>{r.student.class ?? '-'}</td>
                  <td>{r.student.grade_level ?? '-'}</td>
                  <td>{r.academic_year.name ?? '-'}</td>
                  <td>{fmtPct(r.overall_percentage)}</td>
                  <td>
                    <span className={`grade-letter grade-${r.grade_letter.toLowerCase()}`}>
                      {r.grade_letter}
                    </span>
                  </td>
                  <td>
                    <Badge tone={r.passed ? 'green' : 'red'}>{r.passed ? 'passed' : 'failed'}</Badge>
                  </td>
                  <td className="td-actions">
                    <Link className="btn btn-sm btn-primary" to={`/final-results/${r.student.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !loading ? <div className="empty-state">No results found.</div> : null}
          {meta ? <Pagination page={meta.current_page} last={meta.last_page} onPage={setPage} /> : null}
        </div>
      )}
    </div>
  );
}