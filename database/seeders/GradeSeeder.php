<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('is_current', true)->firstOrFail();
        $departments = Department::all();

        foreach (Student::all() as $student) {
            foreach ($departments as $department) {
                $grade = fake()->numberBetween(55, 100);

                Grade::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'department_id' => $department->id,
                        'academic_year_id' => $year->id,
                        'name' => $department->name,
                    ],
                    [
                        'student_id' => $student->id,
                        'department_id' => $department->id,
                        'academic_year_id' => $year->id,
                        'grade_level_id' => $student->grade_level_id,
                        'name' => $department->name,
                        'grade' => $grade,
                        'result' => $grade >= $department->max_grade * 0.5 ? 'Pass' : 'Fail',
                        'description' => null,
                    ]
                );
            }
        }
    }
}