import { getList } from './api';
import type { AcademicYear, Department, Exam, GradeLevel, SchoolClass, Student, Teacher, TeacherShift, User } from './types';

export async function loadUsers(role?: string): Promise<User[]> {
  const res = await getList<User>('/users', { per_page: 100 });
  const users = res.data;
  return role ? users.filter((u) => u.role === role) : users;
}

export async function loadClasses(): Promise<SchoolClass[]> {
  const res = await getList<SchoolClass>('/school-classes', { per_page: 100 });
  return res.data;
}

export async function loadGradeLevels(): Promise<GradeLevel[]> {
  const res = await getList<GradeLevel>('/grade-levels', { per_page: 100 });
  return res.data;
}

export async function loadAcademicYears(): Promise<AcademicYear[]> {
  const res = await getList<AcademicYear>('/academic-years', { per_page: 100 });
  return res.data;
}

export async function loadDepartments(): Promise<Department[]> {
  const res = await getList<Department>('/departments', { per_page: 100 });
  return res.data;
}

export async function loadStudents(): Promise<Student[]> {
  const res = await getList<Student>('/students', { per_page: 100 });
  return res.data;
}

export async function loadTeachers(): Promise<Teacher[]> {
  const res = await getList<Teacher>('/teachers', { per_page: 100 });
  return res.data;
}

export async function loadExams(): Promise<Exam[]> {
  const res = await getList<Exam>('/exams', { per_page: 100 });
  return res.data;
}

export async function loadShifts(): Promise<TeacherShift[]> {
  const res = await getList<TeacherShift>('/teacher-shifts', { per_page: 100 });
  return res.data;
}