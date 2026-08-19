import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui';

interface NavItem {
  to: string;
  label: string;
  roles: Array<'admin' | 'teacher' | 'student'>;
}

const nav: NavItem[] = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'teacher', 'student'] },
  { to: '/students', label: 'Students', roles: ['admin', 'teacher'] },
  { to: '/teachers', label: 'Teachers', roles: ['admin'] },
  { to: '/classes', label: 'Classes', roles: ['admin', 'teacher'] },
  { to: '/grade-levels', label: 'Grade Levels', roles: ['admin'] },
  { to: '/academic-years', label: 'Academic Years', roles: ['admin'] },
  { to: '/departments', label: 'Departments', roles: ['admin'] },
  { to: '/grades', label: 'Grades', roles: ['admin', 'teacher'] },
  { to: '/shifts', label: 'Schedule', roles: ['admin', 'teacher'] },
  { to: '/attendance', label: 'Attendance', roles: ['admin', 'teacher'] },
  { to: '/exams', label: 'Exams', roles: ['admin', 'teacher'] },
  { to: '/exam-results', label: 'Exam Results', roles: ['admin', 'teacher'] },
  { to: '/final-results', label: 'Final Results', roles: ['admin', 'teacher'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) return null;

  const items = nav.filter((item) => item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    toast('Logged out successfully', 'gray');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span className="brand-text">Madraste</span>
        </div>
        <nav className="nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            {user.full_name}
            <span className={`role-chip role-${user.role}`}>{user.role}</span>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
