import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import ClassesPage from './pages/ClassesPage';
import GradeLevelsPage from './pages/GradeLevelsPage';
import AcademicYearsPage from './pages/AcademicYearsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import GradesPage from './pages/GradesPage';
import ShiftsPage from './pages/ShiftsPage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import ExamResultsPage from './pages/ExamResultsPage';
import FinalResultsPage from './pages/FinalResultsPage';
import FinalResultDetailPage from './pages/FinalResultDetailPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/grade-levels" element={<GradeLevelsPage />} />
        <Route path="/academic-years" element={<AcademicYearsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/shifts" element={<ShiftsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exam-results" element={<ExamResultsPage />} />
        <Route path="/final-results" element={<FinalResultsPage />} />
        <Route path="/final-results/:studentId" element={<FinalResultDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}