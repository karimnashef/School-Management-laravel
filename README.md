# School Management System

A full-stack school management platform with a **Laravel 13 REST API** and a **React + TypeScript SPA**. It covers the complete daily workflow of a school: users and roles, students, teachers, classes, departments, attendance, grades, exams, exam results, automatic final-result computation, and teacher shift scheduling with an automatic schedule generator.

Built and verified end-to-end on a local WAMP stack (PHP 8.5 / MySQL 8), with seeded demo data for immediate exploration.

---

## Features

### Roles & Access Control
- Three roles: **Admin**, **Teacher**, **Student** — role-based navigation and data visibility
- Sanctum token authentication with per-email progressive lockout and generic error messages
- 12 Laravel Policies (`UserPolicy`, `StudentPolicy`, `TeacherPolicy`, `SchoolClassPolicy`, `GradePolicy`, `GradeLevelPolicy`, `AcademicYearPolicy`, `AttendancePolicy`, `DepartmentPolicy`, `TeacherShiftPolicy`, `ExamPolicy`, `ExamResultPolicy`) with an admin bypass gate
- Rate limiting: `login` 5/min, `register` 3/min, `api` 120/min, `bulk` 10/min, `sensitive` 10/hour

### Academic Modules
- **Students / Teachers** — full CRUD with departments, qualifications, and per-teacher shift pricing
- **Classes** — linked to grade levels and academic years, capacity + status + type (mix/girls/boys)
- **Grade Levels, Academic Years, Departments** — lookup management, "current academic year" flag
- **Grades** — per-student grades linked to subjects and class shifts
- **Attendance** — single entry or **bulk per class shift** (one transaction)
- **Exams** — CRUD with draft/published workflow (`POST /exams/{exam}/publish`)
- **Exam Results** — single or **bulk entry per exam** with automatic percentage and pass/fail
- **Final Results** — computed on demand per student: subject percentages from published exams only, overall average, pass mark 50, letter grade (A 90+, B 80+, C 70+, D 50+, F <50)

### Teacher Shifts & Schedule Generation
- Manual shift CRUD with **overlap conflict detection** (same teacher, same date, overlapping time -> 422)
- Substitute teacher support (`switch_to_id`)
- **Automatic schedule generator** (`POST /teacher-shifts/generate`):
  - Date range (max 62 days), time slot, working days (default Mon–Fri), multi-class and optional teacher pool selection, `replace_existing` option
  - Constraint engine: one shift per teacher per day, no overlapping slots, weekly cap (`required_shifts_per_week`), workload balancing (least-loaded teacher picked first)
  - Fully transactional — any failure rolls back completely
- **Weekly schedule calendar UI** — Mon–Sun columns, week navigation, class/teacher filters, click-to-edit, add per day

### Frontend (React + TypeScript)
- 16 pages: Login, role-aware Dashboard, Users, Students, Teachers, Classes, Grade Levels, Academic Years, Departments, Grades, Shifts (weekly Schedule), Attendance (single + bulk), Exams (publish), Exam Results (single + bulk), Final Results (filters + detail)
- Axios with token interceptor, 401 auto-logout, typed API helpers, consistent toast/error handling
- Strict TypeScript, shared UI kit (modals, tables, pagination, status badges, form fields)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.3+, Laravel 13, Laravel Sanctum 4 |
| Database | MySQL 8 (InnoDB), UUID primary keys, soft deletes, DB enums |
| Frontend | React 18, TypeScript 5 (strict), Vite 5, React Router 6, Axios |
| Caching / Queues | Database driver (no Redis required) |
| API | REST under `/api/v1` — 72 routes, JSON envelope, pagination, validation |

---

## Project Structure

```
school-management/
├── app/
│   ├── Enums/            # 8 PHP enums mirroring DB enums (roles, statuses, exam types)
│   ├── Exceptions/       # DomainException with HTTP status
│   ├── Http/
│   │   ├── ApiResponse/  # success/paginated/error envelope helpers
│   │   ├── Controllers/  # 15 controllers
│   │   ├── Middleware/   # active-user + security headers
│   │   ├── Requests/     # 31 form requests (validation + role authorization)
│   │   └── Resources/    # 13 API resources
│   ├── Models/           # 12 models
│   ├── Policies/         # 12 policies
│   └── Services/         # 14 services (business logic incl. schedule generation)
├── database/
│   ├── migrations/       # 15 tables
│   └── seeders/          # DatabaseSeeder + 12 demo seeders
├── docs/
│   ├── ARCHITECTURE.md
│   └── PROJECT_EXPLANATION.txt
└── front-end/            # React + TypeScript SPA (Vite)
    └── src/
        ├── components/   # Layout, UI kit
        ├── lib/          # API client, types, formatting, reference loaders
        ├── pages/        # 16 pages
        └── styles/
```

---

## Demo Accounts

All seeded accounts use the password `password`:

| Role | Email |
|---|---|
| Admin | `admin@school.test` |
| Teacher | `ahmed.hassan@school.test`, `mona.ibrahim@school.test`, `sara.khaled@school.test` |
| Student | `omar.mostafa@school.test`, `laila.adel@school.test`, `youssef.tarek@school.test`, `mariam.samir@school.test`, `karim.fawzy@school.test`, `nour.hany@school.test`, `adam.sherif@school.test`, `salma.magdy@school.test`, `ali.ezzat@school.test` |

Seed data: 3 classes, 3 teachers, 9 students, 27 exams, 81 exam results, 15 teacher shifts, 45 attendance records.

---

## Getting Started

### Prerequisites

- PHP 8.3+ with Composer
- MySQL 8
- Node.js 18+ with npm

### 1. Backend

```bash
composer install
cp .env.example .env        # set DB_* for your MySQL database (e.g. schooldb)
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve            # http://localhost:8000
```

`.env` also needs the frontend origin in `CORS_ALLOWED_ORIGINS`, e.g.:

```
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://localhost:5173,http://127.0.0.1:5173
```

### 2. Frontend

```bash
cd front-end
npm install
npm run dev                  # http://localhost:5173 (proxies /api to :8000)
```

Open `http://localhost:5173` and sign in with any demo account.

### Production build

```bash
cd front-end
npm run build                # outputs to front-end/dist
```

---

## API Overview

- Base path: `/api/v1` — all routes require authentication except `POST /auth/login` and `POST /auth/register`
- Uniform envelope:

```json
{
  "success": true,
  "message": "Login successful",
  "data": { ... }
}
```

- Errors return `success: false` with `message` and optional `errors` (field validation)
- List endpoints support `?per_page=` and return a `meta` block (pagination totals)
- Key endpoints:

```
POST   /api/v1/auth/login                  POST   /api/v1/auth/logout
GET    /api/v1/auth/me                     POST   /api/v1/auth/register
GET|POST|PUT|PATCH|DELETE  /api/v1/students, /teachers, /school-classes, /grades,
                           /grade-levels, /academic-years, /departments, /exams,
                           /exam-results, /teacher-shifts, /attendances, /users
POST   /api/v1/exams/{exam}/publish        POST   /api/v1/exam-results/bulk
POST   /api/v1/attendances/bulk            POST   /api/v1/teacher-shifts/generate
GET    /api/v1/final-results               GET    /api/v1/final-results/{student}
```

---

## Key Business Logic

**Final result computation** (`FinalResultService`): only **published** exams count. Per subject: `% = sum(score) / sum(max_grade) * 100`; overall = mean of subject percentages. Pass mark is 50; letter grades: A (90+), B (80+), C (70+), D (50+), F (<50).

**Schedule generation** (`TeacherShiftService::generate`): plans the whole range in memory first, then persists in a single transaction. Assignments respect: teacher availability (no overlapping shift), one shift per teacher per day, weekly shift caps, and workload balance. Any conflict fails the entire run with a descriptive error and leaves the database untouched.

**Data integrity**: UUID primary keys, soft deletes, `unique` constraints (e.g. exam result per exam+student), transactional bulk operations.

---

## Troubleshooting

- **WAMP / XAMPP MySQL and transactions**: this project relies on transactions (bulk operations, schedule generation). Ensure tables use **InnoDB**, not MyISAM (WAMP historically defaults to MyISAM). Convert with `ALTER TABLE <table> ENGINE=InnoDB` or set `default_storage_engine=InnoDB` in `my.ini`.
- **CORS errors**: add the frontend origin to `CORS_ALLOWED_ORIGINS` in `.env` and restart the backend.

---

## Known Gaps / Next Steps

- Password reset / email verification: validation requests exist, endpoints not yet wired
- No automated test suite beyond Laravel boilerplate (verified via live end-to-end smoke tests)
- Natural next steps: notifications, audit-log viewer UI, PDF report exports, deployment (CI/CD, Docker)

---

## License

MIT