<?php

namespace Database\Seeders;

use App\Enums\ExamResultStatusEnum;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use Illuminate\Database\Seeder;

class ExamResultSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Student::all() as $student) {
            $exams = Exam::where('grade_level_id', $student->grade_level_id)
                ->where('academic_year_id', $student->academic_year_id)
                ->get();

            foreach ($exams as $exam) {
                $score = fake()->numberBetween(35, 100);
                $maxGrade = (float) $exam->max_grade;

                ExamResult::updateOrCreate(
                    ['exam_id' => $exam->id, 'student_id' => $student->id],
                    [
                        'exam_id' => $exam->id,
                        'student_id' => $student->id,
                        'score' => $score,
                        'status' => $score >= $maxGrade * 0.5
                            ? ExamResultStatusEnum::PASSED
                            : ExamResultStatusEnum::FAILED,
                        'remarks' => null,
                    ]
                );
            }
        }
    }
}