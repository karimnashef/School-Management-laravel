export type Role = 'student' | 'teacher' | 'admin';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  role: Role;
  status: string;
  student?: Student;
  teacher?: Teacher;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  user_id: string;
  class_id: string;
  grade_level_id: string;
  academic_year_id: string;
  admission_date: string;
  age: number | null;
  blood_group: string | null;
  user?: User;
  class?: SchoolClass;
  grade_level?: GradeLevel;
  academic_year?: AcademicYear;
}

export interface Teacher {
  id: string;
  user_id: string;
  department_id: string;
  qualification: string | null;
  join_date: string;
  required_shifts_per_week: number | null;
  price_per_shift: number | string | null;
  user?: User;
  department?: Department;
}

export interface SchoolClass {
  id: string;
  name: string;
  description: string | null;
  grade_level_id: string;
  academic_year_id: string;
  capacity: number | null;
  status: 'active' | 'inactive' | 'maintenance';
  type: 'male' | 'female' | 'mix';
  students_count?: number;
  grade_level?: GradeLevel;
  academic_year?: AcademicYear;
}

export interface GradeLevel {
  id: string;
  name: string;
  level: number;
  stage: string;
  description: string | null;
  classes_count?: number;
  students_count?: number;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  max_grade: number | string | null;
  min_grade: number | string | null;
  teachers_count?: number;
  grades_count?: number;
}

export interface Grade {
  id: string;
  student_id: string;
  academic_year_id: string;
  grade_level_id: string;
  department_id: string | null;
  name: string;
  grade: number;
  percentage: number;
  result: string | null;
  description: string | null;
  student?: Student;
  department?: Department;
  academic_year?: AcademicYear;
  grade_level?: GradeLevel;
}

export type ShiftStatus = 'scheduled' | 'completed' | 'absent' | 'cancelled';

export interface TeacherShift {
  id: string;
  teacher_id: string;
  class_id: string;
  switch_to_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes: string | null;
  teacher?: Teacher;
  class?: SchoolClass;
  switch_to?: Teacher;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id: string;
  student_id: string;
  shift_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  student?: Student;
  shift?: TeacherShift;
}

export type ExamType = 'quiz' | 'midterm' | 'final';
export type ExamStatus = 'draft' | 'published';
export type ExamResultStatus = 'passed' | 'failed';

export interface Exam {
  id: string;
  exam_type: ExamType;
  name: string;
  subject: string;
  class_id: string | null;
  grade_level_id: string;
  academic_year_id: string;
  department_id: string | null;
  exam_date: string;
  max_grade: string;
  status: ExamStatus;
  results_count?: number;
  class?: SchoolClass;
  grade_level?: GradeLevel;
  academic_year?: AcademicYear;
  department?: Department;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: string;
  max_grade?: string;
  percentage: number;
  status: ExamResultStatus;
  remarks: string | null;
  exam?: Exam;
  student?: Student;
}

export interface FinalSubject {
  subject: string;
  percentage: number;
  exams_count: number;
}

export interface FinalExamRow {
  exam_id: string;
  exam_name: string;
  exam_type: ExamType;
  subject: string;
  exam_date: string;
  max_grade: string;
  score: string;
  percentage: number;
  status: ExamResultStatus;
}

export interface FinalResult {
  student: {
    id: string;
    name: string;
    class: string | null;
    grade_level: string | null;
  };
  academic_year: { id: string | null; name: string | null };
  overall_percentage: number;
  pass_mark: number;
  passed: boolean;
  grade_letter: string;
  subjects: FinalSubject[];
  exams: FinalExamRow[];
}

export interface LoginResponse {
  token: string;
  user: User;
}