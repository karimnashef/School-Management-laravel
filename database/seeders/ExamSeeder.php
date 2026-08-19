<?php

namespace Database\Seeders;

use App\Enums\ExamStatusEnum;
use App\Enums\ExamTypeEnum;
use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Exam;
use App\Models\GradeLevel;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('is_current', true)->firstOrFail();
        $subjects = Department::whereIn('name', ['Mathematics', 'Science', 'Languages'])->get();

        $types = [
            ExamTypeEnum::QUIZ->value => ['Quiz 1', '2025-10-15'],
            ExamTypeEnum::MIDTERM->value => ['Midterm Exam', '2025-12-20'],
            ExamTypeEnum::FINAL->value => ['Final Exam', '2026-05-25'],
        ];

        foreach (GradeLevel::all() as $gradeLevel) {
            foreach ($subjects as $department) {
                foreach ($types as $type => [$suffix, $date]) {
                    $name = "{$gradeLevel->name} {$suffix} - {$department->name}";

                    Exam::updateOrCreate(['name' => $name], [
                        'exam_type' => ExamTypeEnum::from($type),
                        'name' => $name,
                        'subject' => $department->name,
                        'class_id' => null,
                        'grade_level_id' => $gradeLevel->id,
                        'academic_year_id' => $year->id,
                        'department_id' => $department->id,
                        'exam_date' => $date,
                        'max_grade' => 100,
                        'status' => ExamStatusEnum::PUBLISHED,
                    ]);
                }
            }
        }
    }
}