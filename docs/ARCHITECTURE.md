# School Management System — Backend Architecture

> Version 1.0 — Design document (Phase 0). No implementation code yet.
> Stack: Laravel 13 (PHP 8.4+) · MySQL 8 · Redis · Laravel Sanctum · Queues · Events/Listeners · Scheduler · Supabase Realtime (notifications only).

---

## 0. Context and Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Framework | Laravel 13 (installed), PHP `^8.4` (bump from `^8.3` in Phase 2) | Current LTS-style release line; PHP 8.4 required by spec |
| Database | MySQL 8 (InnoDB, utf8mb4) | FK constraints, composite indexes, transactions, JSON columns |
| Cache / Queue / Locks / Rate limits | Redis (phpredis) | Single infra for all four; TTL discipline keeps MySQL as source of truth |
| Auth | Laravel Sanctum (personal access tokens) | Stateless API tokens with abilities + expiry; SPA cookie mode available |
| Realtime | Supabase Realtime — **notifications only** | Laravel remains the source of truth; Supabase is a push channel, never business logic |
| API | `/api/v1` versioned, JSON envelope | Breaking changes go to `/api/v2` without touching v1 |
| Testing | PHPUnit (installed) + Factories + Seeders | Unit / Feature / API / Security suites |
| Style | MVC + pragmatic Clean Architecture | Thin controllers, Services for business logic, Policies for authorization, no DDD, no microservices |

**Non-goals (explicit):** no frontend, no microservices, no DDD, no modular monolith, no event sourcing, no CQRS, no repository-per-model ceremony.

---

## 1. Complete Backend Architecture

A single deployable Laravel application. All domains live in one codebase; separation is **logical (layers), not physical (services)**.

```
┌────────────────────────────────────────────────────────────────────┐
│                         HTTP Edge (routes/api.php)                 │
│  Middleware pipeline: RequestId → SecurityHeaders → AuditRequest   │
│  → throttle → auth:sanctum → EnsureUserIsActive → CheckPermission │
│  → Policy (per-resource)                                           │
├────────────────────────────────────────────────────────────────────┤
│  Controllers (thin)  — validate via FormRequest, call ONE service  │
│                        method, return Resource + envelope          │
├────────────────────────────────────────────────────────────────────┤
│  Services (business logic) — transactions, orchestration, engines  │
│  StudentService · ClassificationService · ScheduleService · ...    │
├────────────────────────────────────────────────────────────────────┤
│  Repositories (complex queries ONLY) — reports, engine data loads  │
├────────────────────────────────────────────────────────────────────┤
│  Models — relationships, scopes, casts. Policies — authorization   │
├────────────────────────────────────────────────────────────────────┤
│  Events → Listeners → Jobs (async side effects)                    │
│  Notifications · Audit · Emails · Reports · Imports · Engines      │
├────────────────────────────────────────────────────────────────────┤
│  Infrastructure: MySQL (source of truth) · Redis (cache/queue/     │
│  locks/rate-limit/previews) · Storage (files) · Supabase (push)    │
└────────────────────────────────────────────────────────────────────┘
```

**Request lifecycle (normalized):**

1. Request hits `routes/api.php` under `/api/v1`.
2. Global middleware: `RequestId` (accepts or generates `X-Request-ID`), `SecurityHeaders`, `AuditRequest` (lightweight metadata), CORS.
3. Group middleware: rate limit → Sanctum auth → `EnsureUserIsActive` → permission/role checks.
4. Controller receives a validated `FormRequest` (validation + `authorize()` already ran).
5. Controller calls exactly one Service method; the Service owns transactions and business rules.
6. Service persists via Eloquent models; side effects are dispatched as Events → queued Listeners/Jobs.
7. Controller returns an API Resource wrapped in the standard envelope.

**Rules that keep the architecture honest:**

- Controllers never contain business logic, raw queries, or `$request->all()`.
- Services never receive `Request` objects — they receive validated arrays/DTOs (testable, HTTP-free).
- Repositories exist only where query complexity justifies them (reports, classification/schedule data loading). CRUD goes through Eloquent directly.
- Every sensitive mutation is: validated (FormRequest) → authorized (Policy) → executed (Service) → audited (Event/Job).

---

## 2. MVC + Clean Architecture Explanation

Clean Architecture's core idea is the **dependency rule**: source-code dependencies point inward, toward business rules. We map it onto Laravel pragmatically — no ports/adapters ceremony, no DDD aggregates.

| Clean Architecture layer | Laravel construct | Responsibility | Depends on |
|---|---|---|---|
| Interface adapters (in) | Routes, Middleware, Controllers, Form Requests, Resources | HTTP in/out, validation, output shaping | Services |
| Application / use cases | **Services** | Business logic, transactions, orchestration | Models, Repositories, Events |
| Domain / entities | **Models** (+ Policies, Rules) | Relationships, invariants, scopes, authorization | — |
| Data access | **Repositories** (only for complex queries) | Query complexity isolation | Models |
| Interface adapters (out) | Events, Listeners, Jobs, Notifications | Async side effects, mail, push | Services/Models |
| Infrastructure | MySQL, Redis, Storage, Supabase, config | Persistence, cache, queue, push | — |

**Dependency direction:** `HTTP → Services → Models/Repositories`. Services never import HTTP classes; Models never import Services. This is what makes Services unit-testable and keeps Controllers thin.

**Where business logic lives (and doesn't):**

- Validation → Form Requests (types, lengths, formats, enums, existence, uniqueness, relationships).
- Authorization → Policies + permission middleware (never inside controllers).
- Database relationships → Models.
- Async work → Jobs (notifications, reports, imports, engines).
- Cross-cutting concerns → Middleware (rate limiting, headers, request ID, audit).
- Domain operations → Services (e.g., "enroll student", "generate schedule", "record result").

**What we deliberately avoid:** repository-per-model, service-per-model, DTO-per-request, hexagonal ports. Three similar lines of code beat a premature abstraction.

---

## 3–5. Database Design

### 3.1 Design principles

- InnoDB + utf8mb4; every FK has an index; every query path has a composite index.
- **Database-level invariants** (not just app validation): unique constraints for "student in one class per year", "no duplicate student numbers", "no teacher double-booked in a slot".
- Soft deletes (`deleted_at`) on master data (students, teachers, parents, books, buses). **Never** on transactional/audit data (attendance, results, payments, audit_logs) — those are immutable history.
- Money as `DECIMAL(10,2)`; percentages as `DECIMAL(5,2)`; enums as MySQL `ENUM` where the set is closed, `VARCHAR` + app-level validation where it may grow.
- JSON columns for flexible config (working_days, classification config, schedule config) — never for queryable data.
- `created_by`/`updated_by` on mutable master data for traceability.

### 3.2 Table inventory (all tables)

**Auth & identity**

| Table | Purpose |
|---|---|
| `users` | Authentication/account only (name, email, password, status, email_verified_at, last_login_at, last_login_ip, last_login_user_agent, must_change_password, deleted_at) |
| `roles` | RBAC roles (name, slug unique, description, is_system) |
| `permissions` | Granular permissions (name, slug unique, group, description) |
| `role_user` | Many-to-many users↔roles |
| `permission_role` | Many-to-many roles↔permissions |
| `personal_access_tokens` | Sanctum tokens (default schema) |
| `user_sessions` | Session/token metadata for management (token_id, ip, user_agent, device, last_activity_at, revoked_at) |
| `login_attempts` | Persistent failed/successful login tracking (email, ip, user_agent, success, user_id?, reason, attempted_at) |
| `password_reset_tokens` | Default Laravel schema |

**People**

| Table | Purpose |
|---|---|
| `students` | Student profile (student_number unique, fname, lname, phone, dob, gender, address, nationality, admission_date, previous_school, status, profile_image, deleted_at) |
| `parents` | Guardian profile (name, phone, email, address, relationship, emergency_contact, deleted_at) |
| `student_parent` | Many-to-many students↔parents with `relationship`, `is_primary` |
| `teachers` | Teacher profile (employee_number unique, first_name, last_name, phone, email, specialization, hire_date, status, deleted_at) |
| `employees` | HR staff (employee_number unique, names, phone, email, department_id, position_id, hire_date, employment_type, status, deleted_at) |
| `departments` | HR departments |
| `positions` | HR positions (belongs to department) |
| `leaves` | Leave requests (type, dates, days, reason, status, approved_by) |

**Academic structure**

| Table | Purpose |
|---|---|
| `academic_years` | e.g. 2026/2027 (name, start_date, end_date, is_current, status) |
| `terms` | Term 1..3 per year (academic_year_id, name, sequence, start_date, end_date, status; unique(academic_year_id, sequence)) |
| `grades` | Grade 1..12 (name, code unique, description, status, sort_order) |
| `classrooms` | Physical rooms (name, code, capacity, building, floor, room_number, status) |
| `classes` | e.g. 10-A (grade_id, academic_year_id, name, code, section, capacity, classroom_id, homeroom_teacher_id, status; unique(academic_year_id, code)) |
| `class_students` | **Current** enrollment (class_id, student_id, academic_year_id, enrolled_at, status; unique(academic_year_id, student_id)) |
| `class_student_history` | Enrollment history (student_id, class_id, academic_year_id, enrolled_at, left_at, reason) |
| `subjects` | (name, code unique, description, maximum_marks, passing_marks, weekly_hours, mandatory, status) |
| `grade_subject` | Subjects offered per grade (grade_id, subject_id, weekly_hours, maximum_marks, passing_marks, mandatory) |
| `class_subject` | Subjects taught per class + assigned teacher (class_id, subject_id, teacher_id?, weekly_hours) |
| `teacher_subject` | Teacher qualifications (teacher_id, subject_id, grade_id?) |

**Exams & grading**

| Table | Purpose |
|---|---|
| `exams` | (name, type ENUM midterm/final/quiz/monthly/practical/oral/assignment, academic_year_id, term_id, grade_id, class_id?, subject_id, teacher_id, exam_date, start_time, end_time, maximum_marks, passing_marks, weight, status) |
| `exam_results` | (exam_id, student_id, marks, percentage, grade, gpa, status, remarks, graded_by, graded_at; unique(exam_id, student_id)) |
| `grading_scales` | Configurable scales (name, academic_year_id? NULL=global, min_percentage, max_percentage, letter_grade, gpa, points, pass) |

**Attendance**

| Table | Purpose |
|---|---|
| `attendance` | Roll-call session header (school_date, class_id, subject_id?, teacher_id, shift_id?, created_by; unique(class_id, subject_id, school_date)) |
| `student_attendance` | Per-student rows (attendance_id, student_id, status ENUM present/absent/late/excused, notes; unique(attendance_id, student_id)) |
| `teacher_attendance` | (teacher_id, date, status, check_in, check_out, notes, marked_by; unique(teacher_id, date)) |

**Shifts & schedules**

| Table | Purpose |
|---|---|
| `shifts` | Morning/Afternoon (name, start_time, end_time, working_days JSON, break_start, break_end, status) |
| `schedule_slots` | Period definitions per shift (shift_id, period_number, start_time, end_time, is_break; unique(shift_id, period_number)) |
| `schedules` | Generated weekly grid (class_id, academic_year_id, term_id, day_of_week, slot_id, subject_id, teacher_id, classroom_id, status; unique(class_id, day_of_week, slot_id), unique(teacher_id, day_of_week, slot_id), unique(classroom_id, day_of_week, slot_id)) |
| `teacher_availability` | (teacher_id, day_of_week, start_time, end_time, shift_id?, status; unique(teacher_id, day_of_week, start_time)) |
| `schedule_generation_runs` | Engine run audit (academic_year_id, term_id, config JSON, status, preview_key, conflicts JSON, created_by, confirmed_by, confirmed_at) |

**Assignments**

| Table | Purpose |
|---|---|
| `assignments` | (class_id, subject_id, teacher_id, title, description, type ENUM homework/assignment/project, due_at, maximum_marks, status) |
| `assignment_submissions` | (assignment_id, student_id, content, file_path, submitted_at, marks, feedback, graded_by, graded_at, status; unique(assignment_id, student_id)) |

**Notifications & announcements**

| Table | Purpose |
|---|---|
| `notifications` | Laravel default — in-app notification records (source of truth) |
| `announcements` | (title, content, priority, audience_type ENUM global/grade/class/teachers/students/parents, grade_id?, class_id?, publish_at, expires_at, status, created_by) |
| `school_events` | (title, description, event_date, start_time, end_time, location, audience_type, grade_id?, class_id?, status, created_by) |

**Fees & payments**

| Table | Purpose |
|---|---|
| `fees` | Fee definitions (name, code unique, type ENUM tuition/registration/other, amount, academic_year_id, grade_id?, term_id?, due_date, status) |
| `discounts` | (name, type ENUM percentage/fixed, value, description, status) |
| `scholarships` | (name, type ENUM percentage/fixed, value, description, status) |
| `fee_invoices` | Per-student invoice (student_id, fee_id, academic_year_id, term_id, amount, discount_id?, discount_amount, scholarship_id?, scholarship_amount, total_due, paid_amount, status ENUM unpaid/partial/paid/waived, due_date; unique(student_id, fee_id, academic_year_id, term_id)) |
| `payments` | (invoice_id, student_id, amount, payment_method, reference, received_by, paid_at, receipt_number unique, status) |

**Library**

| Table | Purpose |
|---|---|
| `book_authors` | (name, bio) |
| `book_categories` | (name, code, description) |
| `books` | (title, isbn unique?, author_id, category_id, publisher, published_year, description, status) |
| `book_copies` | (book_id, copy_code unique, condition, status ENUM available/borrowed/lost/damaged/withdrawn) |
| `borrowings` | (book_copy_id, user_id, borrowed_at, due_at, returned_at, status ENUM borrowed/returned/overdue/lost, fine_amount, fine_paid) |

**Transportation**

| Table | Purpose |
|---|---|
| `buses` | (plate_number unique, model, capacity, driver_id?, status) |
| `drivers` | (user_id?, name, phone, license_number, status) |
| `routes` | (name, code, bus_id, driver_id, start_time, end_time, status) |
| `bus_stops` | (route_id, name, sequence, arrival_time, status; unique(route_id, sequence)) |
| `student_bus` | (student_id, route_id, bus_stop_id, academic_year_id, status; unique(student_id, academic_year_id)) |

**Classification engine**

| Table | Purpose |
|---|---|
| `classification_runs` | Engine run audit (academic_year_id, grade_id, strategy, config JSON, status ENUM preview/confirmed/cancelled/failed, preview_key, created_by, confirmed_by, confirmed_at) |

**Audit & settings**

| Table | Purpose |
|---|---|
| `audit_logs` | (user_id?, action, entity_type, entity_id, old_values JSON, new_values JSON, ip_address, user_agent, request_id, created_at) |
| `school_settings` | (key unique, value, group, description, is_encrypted) |

### 3.3 Relationships (per domain)

**Auth/RBAC**
- `users` 1—N `personal_access_tokens` (Sanctum), 1—N `user_sessions`, 1—N `login_attempts`
- `users` N—M `roles` via `role_user`; `roles` N—M `permissions` via `permission_role`
- `users` 1—0..1 `students` / `teachers` / `parents` / `employees` / `drivers` (polymorphic-ish profile link via `user_id` unique FK)

**People**
- `students` N—M `parents` via `student_parent` (a student has many guardians; a guardian has many students)
- `students` 1—N `class_students` (current) and `class_student_history` (history)
- `teachers` N—M `subjects` via `teacher_subject`; `teachers` 1—N `classes` (homeroom)
- `employees` N—1 `departments`, N—1 `positions`; `employees` 1—N `leaves`

**Academic**
- `academic_years` 1—N `terms`, 1—N `classes`, 1—N `exams`, 1—N `fees`
- `grades` 1—N `classes`; `grades` N—M `subjects` via `grade_subject`
- `classes` N—M `subjects` via `class_subject` (with teacher); `classes` 1—N `class_students`
- `classrooms` 1—N `classes`; `classrooms` 1—N `schedules`

**Exams**
- `exams` N—1 `academic_years`/`terms`/`grades`/`subjects`/`teachers`, N—1 `classes` (nullable)
- `exams` 1—N `exam_results`; `exam_results` N—1 `students`
- `grading_scales` optional N—1 `academic_years` (NULL = global default)

**Attendance**
- `attendance` 1—N `student_attendance`; `attendance` N—1 `classes`/`subjects`/`teachers`/`shifts`
- `teacher_attendance` N—1 `teachers`

**Schedules**
- `shifts` 1—N `schedule_slots`; `schedule_slots` 1—N `schedules`
- `schedules` N—1 `classes`/`subjects`/`teachers`/`classrooms`/`academic_years`/`terms`
- `teacher_availability` N—1 `teachers`

**Assignments**
- `assignments` N—1 `classes`/`subjects`/`teachers`; 1—N `assignment_submissions`; submissions N—1 `students`

**Fees**
- `fees` 1—N `fee_invoices`; `fee_invoices` N—1 `students`/`discounts`/`scholarships`; 1—N `payments`

**Library**
- `books` N—1 `book_authors`/`book_categories`; 1—N `book_copies`; 1—N `borrowings`; `borrowings` N—1 `users`

**Transportation**
- `buses` 1—N `routes`; `drivers` 1—N `routes`; `routes` 1—N `bus_stops`; `routes` 1—N `student_bus`; `student_bus` N—1 `students`

### 3.4 Key database-level invariants

```sql
-- A student has exactly one current class per academic year
UNIQUE (academic_year_id, student_id) ON class_students

-- No duplicate student numbers / employee numbers / plate numbers / ISBNs / receipt numbers
UNIQUE (student_number) ON students
UNIQUE (employee_number) ON teachers, employees
UNIQUE (plate_number) ON buses
UNIQUE (receipt_number) ON payments

-- A teacher cannot be double-booked in a schedule slot
UNIQUE (teacher_id, day_of_week, slot_id) ON schedules
-- A class cannot have two subjects in the same slot
UNIQUE (class_id, day_of_week, slot_id) ON schedules
-- A classroom cannot host two classes in the same slot
UNIQUE (classroom_id, day_of_week, slot_id) ON schedules

-- One result row per student per exam
UNIQUE (exam_id, student_id) ON exam_results

-- One attendance status per student per roll-call
UNIQUE (attendance_id, student_id) ON student_attendance

-- One term sequence per academic year
UNIQUE (academic_year_id, sequence) ON terms

-- One class code per academic year
UNIQUE (academic_year_id, code) ON classes
```

### 3.5 Indexing strategy (scale: 10k+ students, millions of attendance/audit rows)

- `student_attendance`: composite `(student_id, school_date)`, `(attendance_id)`, `(class_id, school_date)`.
- `audit_logs`: `(entity_type, entity_id)`, `(user_id, created_at)`, `(action, created_at)`; monthly archiving job.
- `exam_results`: `(exam_id)`, `(student_id, exam_id)`.
- `class_students`: `(academic_year_id, grade_id)` via join, `(student_id)`.
- All FK columns indexed (InnoDB requires it for cascades; explicit for hot paths).
- Cursor pagination for high-volume streams (attendance, audit logs, payments); length-aware pagination for admin lists.

---

## 6. Laravel Folder Structure

```
school-management/
├── app/
│   ├── Console/
│   │   ├── Commands/                 # e.g. AuditLogsArchive, AttendanceReminder, FeeReminder
│   │   └── Kernel.php                # scheduler registration
│   ├── Enums/                        # PHP 8 backed enums: UserStatus, Gender, AttendanceStatus, ExamType...
│   ├── Exceptions/
│   │   ├── ApiException.php          # base API exception (status + message + errors)
│   │   └── ...                       # domain exceptions (e.g. ClassFullException, ScheduleConflictException)
│   ├── Events/                       # LoginSucceeded, LoginFailed, StudentCreated, ResultModified, ...
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/V1/               # AuthController, StudentController, ClassController, ...
│   │   │   └── Controller.php
│   │   ├── Middleware/               # RequestId, SecurityHeaders, AuditRequest, EnsureUserIsActive,
│   │   │                             # CheckRole, CheckPermission, EnsureSchoolAccess, ValidateRequestSignature
│   │   ├── Requests/                 # Form Requests per action (StoreStudentRequest, UpdateExamRequest, ...)
│   │   └── Resources/                # API Resources per entity (StudentResource, ExamResource, ...)
│   ├── Jobs/                         # SendNotificationJob, GenerateReportJob, ImportStudentsJob,
│   │                                 # AuditLogJob, RunClassificationJob, RunScheduleGenerationJob
│   ├── Listeners/                    # e.g. LogLoginActivity, WriteAuditLog, PushRealtimeNotification
│   ├── Models/                       # User, Role, Permission, Student, Parent, Teacher, Class, ...
│   ├── Notifications/                # Laravel notifications (PasswordReset, ExamResultPublished, FeeReminder)
│   ├── Policies/                     # StudentPolicy, ExamPolicy, ResultPolicy, SchedulePolicy, ...
│   ├── Repositories/                 # ONLY complex queries: ReportRepository, ClassificationDataRepository,
│   │                                 # ScheduleDataRepository, AttendanceRepository
│   ├── Rules/                        # Custom rules: ValidStudentNumber, ValidFileUpload, NoScheduleConflict
│   ├── Services/                     # AuthService, StudentService, ClassificationService, ScheduleGenerationService,
│   │   │                             # ScheduleConflictService, ExamService, AttendanceService, FeeService,
│   │   │                             # LibraryService, TransportationService, ReportService, AuditLogger,
│   │   │                             # SupabaseNotificationService, ImportService, SettingsService
│   │   └── Classification/           # Strategies: BalancedStrategy, GenderBalancedStrategy,
│   │                                 # AcademicPerformanceStrategy, RandomStrategy,
│   │                                 # PreviousClassSeparationStrategy, CustomWeightedStrategy
│   │   └── Scheduling/               # Strategies: GreedyBacktrackingStrategy (extensible)
│   └── Providers/                    # AppServiceProvider, AuthServiceProvider (gates), EventServiceProvider
├── bootstrap/app.php                 # middleware + exception registration (Laravel 13 style)
├── config/                           # auth, cache, cors, database, filesystems, logging, queue,
│                                     # sanctum, services (supabase), rate-limiting, security, settings
├── database/
│   ├── factories/                    # factories for every model
│   ├── migrations/                   # ~50 migrations, ordered by dependency
│   └── seeders/                      # RolePermissionSeeder, AcademicSeeder, DemoDataSeeder, ...
├── routes/
│   ├── api.php                       # /api/v1 routes (versioned group)
│   ├── web.php                       # minimal (health, fallback)
│   └── console.php
├── storage/app/                      # private uploads (students/, assignments/, imports/, reports/)
├── tests/
│   ├── Unit/                         # services, engines, rules, enums
│   ├── Feature/                      # API flows per domain
│   ├── Feature/Security/             # rate limiting, IDOR, mass assignment, auth
│   └── TestCase.php
└── docs/ARCHITECTURE.md              # this document
```

---

## 7. Middleware Architecture

Registered in `bootstrap/app.php` (Laravel 13 style). Every middleware has one real responsibility.

### Global (all requests)

| Middleware | Responsibility |
|---|---|
| `RequestId` | Accept `X-Request-ID` from client or generate UUID; store in context; add to response header; used by logs, audit, exceptions |
| `SecurityHeaders` | Adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Strict-Transport-Security` (prod only), configurable CSP for non-API responses |
| `AuditRequest` | Lightweight request metadata capture (method, path, ip, user_agent, request_id) for the audit pipeline; no payload logging |
| `HandleCors` | Laravel CORS (config/cors.php) |

### `api` group (all `/api/v1` routes)

| Middleware | Responsibility |
|---|---|
| `throttle:api` | Global API rate limit (60 req/min/user, Redis-backed) |
| `auth:sanctum` | Token authentication |
| `EnsureUserIsActive` | Rejects `pending` (activation required), `inactive`, `suspended` (distinct 403 messages). Folds "PreventSuspendedAccount" into one middleware — a separate one would duplicate responsibility |
| `CheckRole` | `role:admin,principal` — coarse role gate for admin-only areas |
| `CheckPermission` | `permission:students.update` — fine-grained RBAC gate |
| `EnsureSchoolAccess` | Resolves the active academic year + school scope; rejects requests referencing entities outside the school's scope (multi-school-ready) |
| `ValidateRequestSignature` | HMAC signature check — **only** on server-to-server/webhook endpoints (imports from external systems, Supabase callbacks), never on user-facing routes |

### Middleware ordering rationale

Rate limit → auth → status → role → permission → scope. Each layer fails fast with a specific status (429 → 401 → 403), and no authorization check runs before identity is established.

---

## 8. Authentication Architecture

**Mechanism:** Laravel Sanctum personal access tokens (Bearer). Tokens carry **abilities** (e.g. `students:update`) and optional expiry. SPA cookie mode is available but the primary API contract is Bearer tokens.

**Login flow (`POST /api/v1/auth/login`):**

1. `throttle:login` — 5 attempts/min/IP (Redis). Progressive: after 10 cumulative failures per email+IP, lockout 15 min (Redis counter with TTL).
2. Validate credentials (FormRequest: email format, password length).
3. On failure: record `login_attempts` row (success=false, reason), dispatch `LoginFailed` event (audit + security log), return **generic** 401 — never "email not found" vs "wrong password" (anti-enumeration).
4. On success: check `status` — `pending` → 403 "account not activated"; `suspended` → 403 "account suspended"; `inactive` → 403.
5. Issue token with abilities derived from the user's roles/permissions; record `user_sessions` row (ip, user_agent, device); update `users.last_login_at`; dispatch `LoginSucceeded` (audit).
6. Return `{ token, token_type: "Bearer", expires_at, user }`.

**Logout:** revoke current token (or all tokens for "logout everywhere"), record `user_sessions.revoked_at`, audit.

**Token management:** `GET /auth/tokens` (list), `DELETE /auth/tokens/{id}` (revoke), `DELETE /auth/tokens` (revoke all). Token abuse protection: short-lived tokens for sensitive operations, ability scoping, optional single-device mode (revoke previous tokens on new login).

**Password reset:** generic response always — *"Password reset instructions have been sent if the account exists."* Token via `password_reset_tokens` (hashed), strict rate limit (3/hour/email+IP), expiry, audit on completion. No account enumeration.

**Email verification:** `email_verified_at`; verified-only gates for sensitive actions (result publication, fee waivers).

**Account activation:** admin creates user with `status=pending` + activation token; user activates via emailed link; audit.

**Account suspension:** admin action, audited, immediately revokes all tokens, blocks login via `EnsureUserIsActive`.

**Password storage:** `Hash::make()` (bcrypt, `BCRYPT_ROUNDS=12`), `Hash::check()` for verification, `must_change_password` flag for admin-created accounts. Never log or return passwords/tokens.

---

## 9. Authorization Architecture

Three complementary layers — **defense in depth**:

1. **Route middleware** (`CheckPermission`, `CheckRole`) — coarse gate: does the user hold the permission at all?
2. **Policies** — fine gate: can this user act on *this specific record*? (IDOR protection lives here.)
3. **Gates** — ad-hoc checks inside Services for non-resource decisions (e.g. `Gate::allows('manage-settings')`).

**RBAC model:** `users N—M roles N—M permissions`. Permissions are granular (`students.view`, `students.create`, `students.update`, `students.delete`, `students.classify`, `exams.manage`, `results.modify`, `schedules.generate`, `reports.generate`, `audit_logs.view`, `settings.manage`, ...). `Super Admin` is a role with all permissions — checked explicitly, never implicitly (no magic `is_admin` bypass that hides in a helper).

**Policy example (StudentPolicy):**

- `viewAny` → `students.view`
- `view` → `students.view` AND (user is the student's parent OR assigned teacher OR admin)
- `create` → `students.create`
- `update` → `students.update` AND record-level scope (e.g. not archived year)
- `delete` → `students.delete` AND not graduated
- `classify` → `students.classify`

**Rule:** having a permission never implies access to every record. Every `show/update/delete` route calls `$this->authorize('update', $student)`.

**Permission checks are server-side only.** The API is the enforcement point; the (future) frontend is cosmetic.

---

## 10. Security Architecture

### 10.1 Security headers (and why)

| Header | Value | Why |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing attacks (browser executing HTML disguised as image/JSON) |
| `X-Frame-Options` | `DENY` | Blocks clickjacking via iframe embedding |
| `Referrer-Policy` | `no-referrer` | Prevents leaking tokens/URLs in Referer headers to third parties |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser capabilities (API has no need) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (prod only) | Forces HTTPS; never set in dev over HTTP |
| `Content-Security-Policy` | API responses: `default-src 'none'` | API returns JSON only; `'none'` is safe. A looser policy applies only to any web-rendered pages, never to API responses |

**CSP caution:** a strict CSP on the API is safe because the API never serves HTML. We do **not** apply a restrictive CSP to web pages that might legitimately need inline assets — that would break the app. Headers are applied per-response-type.

### 10.2 Rate limiting (Redis-backed, `RateLimiter`)

| Limiter | Limit | Target |
|---|---|---|
| `api` | 60/min per user (or IP) | Global API |
| `login` | 5/min per IP + progressive lockout (10 fails → 15 min) | Brute force / credential stuffing |
| `password-reset` | 3/hour per email+IP | Password attacks |
| `classification` | 2/hour per user | Expensive engine |
| `schedule-generation` | 2/hour per user | Expensive engine |
| `bulk` | 5/min per user | Bulk operations |
| `reports` | 10/min per user | Report generation |
| `exports` | 5/min per user | CSV/Excel exports |
| `uploads` | 20/min per user | File uploads |

Progressive throttling: repeated failures escalate the lockout window (15 min → 1 h → 24 h) via Redis counters with TTLs.

### 10.3 Input validation & mass assignment

- Every request validated by a FormRequest: types, lengths, formats, enums, existence, uniqueness, relationships, authorization (`authorize()`).
- **Never** `$request->all()`. Only `$request->validated()` + explicit model assignment.
- Clients can never set: IDs, `user_id`/ownership, role/permission fields, status transitions, audit fields, timestamps, `created_by`.
- Custom `Rules` for domain invariants (e.g. `NoScheduleConflict`, `ValidStudentNumber`, `ClassNotFull`).

### 10.4 IDOR protection

- Every record-scoped route authorizes via Policy (ownership/scope check).
- Example: `PATCH /api/v1/students/500` → `StudentPolicy::update` verifies the caller may modify *that* student (admin/principal, or the student's own parent for limited fields). Knowing an ID grants nothing.
- Tests assert cross-tenant/cross-role access is denied.

### 10.5 SQL injection

- Eloquent/Query Builder exclusively; no string-concatenated SQL.
- If raw SQL is ever required: parameterized bindings only, input validated first, and a comment in code explaining why raw SQL was necessary.

### 10.6 XSS

- User-generated content (announcements, assignments, notes, remarks, descriptions) is stored as plain text and **escaped at output** (API Resources return text; any future rendering escapes).
- No raw HTML accepted from clients. If rich text is ever needed, it goes through an allowlist sanitizer at the boundary — never trusted blindly.

### 10.7 File uploads

- Validate MIME (magic bytes, not just extension), extension allowlist, size limit (per type: images ≤ 2 MB, documents ≤ 10 MB).
- Server-generated filenames (`uuid.ext`); original filename stored only as metadata.
- Executables blocked (extension + MIME + content sniff).
- Stored in `storage/app/private` (Laravel Storage, `local`/`s3` disk) — **never** in `public/`. Served via authenticated, authorized download endpoints.

### 10.8 Secrets & environment

- All credentials in `.env` (DB, Redis, Supabase service key, mail, app key). `.env` gitignored; `.env.example` committed with placeholders.
- Supabase service-role key is server-side only — never returned to clients.
- `APP_DEBUG=false` in production; no stack traces, SQL, paths, class names, or env vars in responses.

### 10.9 CORS

- `config/cors.php`: `allowed_origins` from `CORS_ALLOWED_ORIGINS` env (explicit list of frontend origins). **No `*`** for authenticated APIs. `supports_credentials` only when cookie auth is used.

### 10.10 Security logging

Logged (never logged: passwords, tokens, secrets):
- failed/successful authentication, password reset, account lockout, permission denials, rate-limit violations, suspicious requests, sensitive data changes, role/permission changes.

---

## 11. Redis Architecture

Redis has **defined, non-overlapping responsibilities**. MySQL remains the source of truth for all permanent data.

| Responsibility | Key namespace | TTL | Notes |
|---|---|---|---|
| Cache | `cache:*` | per-key | Hot reads: class rosters, settings, grading scales, subject lists |
| Queue | `queues:default`, `queues:reports`, `queues:bulk`, `queues:engines` | — | Redis queue driver |
| Rate limiting | `throttle:*` | per-limiter | Laravel RateLimiter |
| Distributed locks | `lock:classification:{year}:{grade}`, `lock:schedule:{year}:{term}` | 10 min | `Cache::lock()` — prevents duplicate engine runs |
| Classification preview | `preview:classification:{run_id}` | 24 h | Temporary result awaiting admin confirmation |
| Schedule preview | `preview:schedule:{run_id}` | 24 h | Temporary result awaiting admin confirmation |
| Security counters | `security:login_failures:{email}`, `security:lockout:{email}`, `security:login_failures:{ip}` | 15 min–24 h | Progressive throttling |
| Idempotency | `idempotency:{key}` | 24 h | Bulk/import job deduplication |

**Rules:** every Redis key has a TTL; nothing business-critical lives only in Redis; previews are disposable (recomputable); locks always released in `finally` blocks.

---

## 12. Queue Architecture

**Driver:** Redis. **Connections (queues):**

| Queue | Work | Workers |
|---|---|---|
| `default` | Notifications, emails, audit logs | 2 |
| `reports` | Report generation, PDF/Excel export | 1 |
| `bulk` | Student import, bulk attendance, bulk notifications | 1 |
| `engines` | Classification, schedule generation | 1 (long-running) |

**Job guarantees:**

- **Retries + backoff:** exponential (`10s, 30s, 1m, 5m, 30m`), `tries` per job type; `failed_jobs` table for inspection/retry.
- **Idempotency:** jobs that must not double-apply (imports, bulk assignments) check an idempotency key in Redis before executing; engines check run status in MySQL.
- **Uniqueness:** `ShouldBeUnique` for per-resource jobs (e.g. one report per student+type at a time).
- **Rate-limited jobs:** `throttles()` for notification bursts (e.g. 100/min to Supabase).
- **Timeouts:** engines get generous timeouts; report jobs chunk work.

**Scheduler (`routes/console.php` + Kernel):** daily audit-log archiving, attendance reminders, fee reminders, expired-announcement cleanup, overdue-borrowing fines, failed-job alerts.

---

## 13. Supabase Notification Architecture

**Principle:** Laravel is the source of truth for notifications; Supabase Realtime is a **push channel only**. No school business logic ever lives in Supabase.

```
[Service creates notification]
        │
        ▼
[Laravel `notifications` table — source of truth]
        │
        ▼
[NotificationCreated event]
        │
        ▼
[PushRealtimeNotification job (queued, rate-limited)]
        │
        ▼
[SupabaseNotificationService — the ONLY Supabase touchpoint]
        │  (service-role key, server-side)
        ▼
[Supabase Realtime: channel `notifications:{user_id}`]
        │
        ▼
[Client receives lightweight signal → fetches full payload from GET /api/v1/notifications]
```

**Design details:**

- `app/Services/SupabaseNotificationService.php` isolates all Supabase HTTP/Realtime calls (REST + Realtime broadcast). One class, one responsibility, easily mocked in tests.
- Channel per user: `notifications:{user_id}`. Payload is a **signal** (`{id, type, title, body, data, created_at}`) — full data always comes from the Laravel API, so Supabase never holds business state.
- Bulk notifications (announcements to 1,000 parents) → `SendBulkNotificationsJob` on the `bulk` queue, chunked, rate-limited, idempotent.
- Failure isolation: if Supabase is down, the notification record still exists in MySQL; the job retries with backoff. The system degrades to polling, never loses data.
- Supabase credentials live in `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`), server-side only.

---

## 14. Student Classification Architecture

**Goal:** assign N students to K classes of a grade for an academic year, per a chosen strategy, with a human-confirmed commit.

**Flow (per spec):**

```
1. Validate request (FormRequest: year, grade, students, class count, capacity, strategy, config)
2. Authorize (Policy: students.classify)
3. Acquire Redis lock  lock:classification:{year}:{grade}  (Cache::lock, 10 min)
4. Load students (chunked, eager-loaded: gender, previous class, academic performance)
5. Compute assignment via strategy
6. Generate preview (class → students, balance metrics)
7. Store preview in Redis  preview:classification:{run_id}  (24 h TTL) + classification_runs row (status=preview)
8. Return preview to admin (no DB writes to class_students yet)
9. Admin confirms (POST /classification-runs/{id}/confirm)
10. Begin DB transaction
11. Assign students (class_students + class_student_history)
12. Commit
13. Release lock (finally)
14. Write audit log (queued)
```

**Strategies** (`app/Services/Classification/`, one class each, common interface):

| Strategy | Behavior |
|---|---|
| `BalancedStrategy` | Equal headcount per class |
| `GenderBalancedStrategy` | Equal headcount + gender distribution per class |
| `AcademicPerformanceStrategy` | Distribute by prior-year performance so class averages are comparable |
| `RandomStrategy` | Shuffle assignment |
| `PreviousClassSeparationStrategy` | Minimize students repeating the same class cohort |
| `CustomWeightedStrategy` | Weighted scoring over configurable factors (gender, performance, siblings, transport route) |

**Protections:**

- **No partial updates:** preview never touches `class_students`; commit is one transaction.
- **No duplicate execution:** Redis lock + `classification_runs.status` guard (a run confirms once).
- **Race conditions:** lock held across load→compute→preview; confirm re-validates capacity under lock.
- **Unauthorized access:** Policy on both `store` and `confirm`.
- **Capacity:** DB-level check + service check — a class can never exceed capacity.

---

## 15. Automatic Schedule Generation Architecture

**Goal:** generate a weekly timetable for classes/teachers/classrooms satisfying hard constraints, with preview + confirmation.

**Constraint model:**

- **Hard (must hold):** teacher not in two classes at once; class not in two subjects at once; classroom not double-booked; teacher availability respected; breaks respected; shift limits respected; weekly subject hours satisfied.
- **Soft (optimize):** teacher workload balance, subject distribution across the week, minimize gaps.

**Flow:**

```
1. Validate request (FormRequest: year, term, classes, teachers, subjects, classrooms, shifts, availability, working days/hours, weekly hours)
2. Authorize (Policy: schedules.generate)
3. Acquire Redis lock  lock:schedule:{year}:{term}
4. Load scheduling data (ScheduleDataRepository — eager-loaded, chunked)
5. Generate schedule via strategy (constructive greedy + backtracking + conflict repair)
6. Detect conflicts (ScheduleConflictService — re-validates every hard constraint)
7. Store preview in Redis  preview:schedule:{run_id}  + schedule_generation_runs (status=preview, conflicts JSON)
8. Return conflicts/results to admin
9. Admin confirms → transactional save to `schedules`
10. Audit operation
11. Release lock (finally)
```

**Engine design (extensible, not naive):**

- `ScheduleGenerationService` orchestrates; a `SchedulingStrategy` interface encapsulates the algorithm.
- Phase 1 implementation: **constructive greedy with backtracking** (assign hardest-first: most-constrained class/teacher, then repair conflicts). The interface allows swapping in CP-SAT / OR-Tools / genetic algorithms later without touching the service, preview, or confirm flow.
- `ScheduleConflictService` is independent and reusable: it validates any proposed schedule (including manually edited ones) against all hard constraints — used by the engine, the confirm step, and manual schedule edits.
- DB unique constraints (`teacher_id, day_of_week, slot_id` etc.) are the final backstop.

---

## 16. API Architecture

**Versioning:** all routes under `/api/v1` (route group in `routes/api.php`). Breaking changes → `/api/v2`; v1 remains stable. Version in the URL (simple, cacheable, explicit).

**RESTful resources** (per domain, standard verbs):

```
POST   /api/v1/auth/login                     POST   /api/v1/students
POST   /api/v1/auth/logout                    GET    /api/v1/students
GET    /api/v1/auth/me                        GET    /api/v1/students/{student}
POST   /api/v1/auth/password/forgot           PATCH  /api/v1/students/{student}
POST   /api/v1/auth/password/reset            DELETE /api/v1/students/{student}
GET    /api/v1/auth/tokens                    POST   /api/v1/students/{student}/restore
DELETE /api/v1/auth/tokens/{token}            POST   /api/v1/students/import
...                                            POST   /api/v1/students/classify
```

Engine endpoints: `POST /api/v1/classification-runs` (preview), `POST /api/v1/classification-runs/{id}/confirm`; same pattern for `schedule-generation-runs`.

**Query conventions:** `?page=2&per_page=25`, `?search=term`, `?filter[status]=active`, `?sort=name,-created_at` (whitelisted sortable columns per resource).

**Pagination:** length-aware for admin lists; **cursor pagination** for high-volume streams (attendance, audit logs, payments).

**Response envelope (every endpoint):**

```json
{ "success": true,  "message": "Student created successfully", "data": { ... } }
{ "success": false, "message": "Validation failed", "errors": { "email": ["..."] } }
{ "success": false, "message": "Unauthenticated" }
{ "success": false, "message": "Forbidden" }
{ "success": false, "message": "Resource not found" }
{ "success": false, "message": "An unexpected error occurred", "request_id": "..." }
```

**Resources:** one API Resource per entity; `whenLoaded()` for relations; no N+1 (eager loading enforced in controllers/services).

---

## 17. Error Handling Architecture

Centralized in `bootstrap/app.php` (`withExceptions`):

| Exception | Status | Response |
|---|---|---|
| `ValidationException` | 422 | `{ success:false, message:"Validation failed", errors:{...} }` |
| `AuthenticationException` | 401 | `{ success:false, message:"Unauthenticated" }` |
| `AuthorizationException` | 403 | `{ success:false, message:"Forbidden" }` |
| `ModelNotFoundException` / `NotFoundHttpException` | 404 | `{ success:false, message:"Resource not found" }` |
| `ThrottleRequestsException` | 429 | `{ success:false, message:"Too many requests", retry_after }` |
| `ApiException` (custom base) | configurable | domain errors (e.g. class full, schedule conflict) |
| `QueryException` / unexpected | 500 | `{ success:false, message:"An unexpected error occurred", request_id }` — full detail logged server-side only |

**Production rules:** no stack traces, no SQL, no filesystem paths, no class names, no env vars, no secrets in any response. `APP_DEBUG=false` enforced. Every 500 response carries the `request_id` so support can correlate with logs.

---

## 18. Audit Logging Architecture

**Model:** `audit_logs` (user_id?, action, entity_type, entity_id, old_values JSON, new_values JSON, ip_address, user_agent, request_id, created_at).

**Mechanism:**

- `AuditLogger` service — single entry point: `AuditLogger::record(action, entity, old, new)`.
- **Model changes:** an `Auditable` trait on sensitive models records create/update/delete diffs automatically (old vs new values, excluding secrets).
- **Security events:** recorded explicitly by services/events — login success/failure, logout, password change/reset, lockout, suspension, role/permission changes, settings changes.
- **Engine operations:** classification runs, schedule generation, confirmations.
- Writes are **queued** (`AuditLogJob`, `default` queue) so the request path never blocks; the job is idempotent.

**What is audited (minimum set):** login, logout, failed login, password change/reset, student create/update/delete/restore/classify, class assignment, teacher assignment, exam create/modify, result modification, attendance modification, schedule generation/modification, role/permission modification, user suspension, settings changes.

**Never logged:** passwords, tokens, secrets, full request bodies.

**Retention & scale:** indexed on `(entity_type, entity_id)`, `(user_id, created_at)`, `(action, created_at)`; monthly archive job moves rows older than N months to an archive table (scheduler). Millions of rows are queryable via cursor pagination.

---

## 19. Testing Strategy

**Framework:** PHPUnit (installed). **DB:** MySQL test database in CI (constraints must be exercised against real MySQL); SQLite in-memory for fast local unit runs where MySQL-specific features aren't involved.

**Suites:**

| Suite | Covers |
|---|---|
| `tests/Unit` | Services (pure logic), classification strategies, schedule conflict service, custom rules, enums, grading scale resolution |
| `tests/Feature` | API flows per domain: auth, students, parents, classes, exams, results, attendance, fees, library, transportation, reports |
| `tests/Feature/Security` | Rate limiting (429s), IDOR (cross-role access denied), mass assignment (forbidden fields ignored), auth (401s), RBAC (403s), file upload validation, audit log creation |

**Required test scenarios (from spec):** authentication, authorization, rate limiting, IDOR protection, student creation, student classification (preview doesn't write, confirm commits, duplicate confirm rejected), class capacity, exam results (authorization + audit), attendance, schedule conflicts (hard constraints), notification authorization, file uploads, bulk operations, audit logging.

**Infrastructure:** factories for every model; `RolePermissionSeeder` shared by tests; `RefreshDatabase`; a `SecurityTestCase` base with helpers (acting as role X, asserting forbidden fields are ignored).

**CI:** `composer test` (config:clear + artisan test) + Pint (style) on every push.

---

## 20. Development Phases

Each phase ends with: working code, migrations, tests, and a security review. No phase starts before the previous one is green.

| Phase | Goal | Key deliverables |
|---|---|---|
| **1** | Architecture + DB design | This document; final schema; migration order |
| **2** | Laravel config + base infra | PHP `^8.4` bump; install Sanctum; enable `routes/api.php`; MySQL + Redis config; `.env.example`; CORS; security headers; `RequestId`; response envelope; base `ApiException`; centralized error handling; `ApiResponse` helper |
| **3** | Auth + Users + Roles + Permissions + Security middleware | users/roles/permissions migrations + seeders; Sanctum auth (login/logout/me/tokens/password reset/email verify/activation/suspension); `EnsureUserIsActive`, `CheckRole`, `CheckPermission`, `EnsureSchoolAccess`; login tracking + rate limiting; audit of auth events |
| **4** | Students + Parents | students/parents/student_parent migrations; CRUD + search/filter/pagination + soft delete/restore; `StudentPolicy`; file uploads (profile image); audit |
| **5** | Academic years + Grades + Classes + Subjects | migrations (academic_years, terms, grades, classrooms, classes, class_students, subjects, grade_subject, class_subject); capacity enforcement; enrollment flow |
| **6** | Automatic student classification | `ClassificationService` + 6 strategies; Redis lock + preview + confirm; `classification_runs`; tests |
| **7** | Teachers | teachers/teacher_subject migrations; CRUD; subject/class assignment; `TeacherPolicy` |
| **8** | Exams + Results + Grading | exams/exam_results/grading_scales migrations; configurable grading; result entry with heavy authorization + audit; `ResultPolicy` |
| **9** | Attendance | attendance/student_attendance/teacher_attendance; bulk marking; percentage/absence/late calculations; `AttendancePolicy` |
| **10** | Shifts + Schedules | shifts/schedule_slots/teacher_availability migrations; manual schedule CRUD with conflict validation |
| **11** | Automatic schedule generation | `ScheduleGenerationService` + `ScheduleConflictService` + greedy/backtracking strategy; Redis lock + preview + confirm; `schedule_generation_runs`; tests |
| **12** | Notifications + Supabase Realtime | `SupabaseNotificationService`; `PushRealtimeNotification` job; notification endpoints; bulk notification job |
| **13** | Assignments | assignments/assignment_submissions; teacher create, student submit, grading + feedback; file attachments |
| **14** | Fees + Payments | fees/discounts/scholarships/fee_invoices/payments; invoicing, payments, receipts (queued PDF), outstanding balances |
| **15** | Library | books/authors/categories/copies/borrowings; borrow/return/late fines |
| **16** | Transportation | buses/drivers/routes/stops/student_bus; capacity checks |
| **17** | Reports | `ReportService` + `ReportRepository`; queued generation; student/attendance/exam/class/workload/fee/distribution/schedule reports |
| **18** | Audit logs | `AuditLogger` + `Auditable` trait + `AuditLogJob`; audit endpoints; archiving job |
| **19** | Import/Export | CSV/Excel student import with per-row validation + import report; queued large imports; exports with rate limits |
| **20** | Testing + Security audit + Performance | Full test suite; security review pass (OWASP-style checklist); N+1 audit, index review, caching pass, load-testing plan |

---

## Appendix A — Security checklist (applies to every phase)

- [ ] Every endpoint: validated (FormRequest) → authorized (Policy) → audited
- [ ] No `$request->all()`; no client-controlled IDs/roles/status/timestamps
- [ ] Generic auth error messages (no enumeration)
- [ ] Rate limits on auth + expensive endpoints
- [ ] No secrets in code, logs, or responses; `.env` only
- [ ] Uploads: MIME + extension + size, server filenames, private storage
- [ ] No raw SQL without parameterized bindings + justification
- [ ] User content escaped at output; no trusted HTML
- [ ] CORS allowlist; no `*` for authenticated APIs
- [ ] Production: `APP_DEBUG=false`, no stack traces, request_id on 500s
- [ ] DB-level unique constraints backstop app-level invariants