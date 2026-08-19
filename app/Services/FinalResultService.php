<?php

namespace App\Services;

use App\Enums\ExamStatusEnum;
use App\Models\AcademicYear;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use Illuminate\Support\Collection;

class FinalResultService
{
    public const PASS_MARK = 50;

    /**
     * Compute the final result for a single student across the published
     * exams of the given academic year (defaults to the student's year).
     *
     * @return array<string, mixed>
     */
    public function forStudent(Student $student, ?AcademicYear $year = null): array
    {
        $yearId = $year?->id ?? $student->academic_year_id;

        $exams = $this->applicableExams($student, $yearId);

        $results = ExamResult::query()
            ->where('student_id', $student->id)
            ->whereIn('exam_id', $exams->pluck('id'))
            ->with(['exam'])
            ->get();

        $studentData = [
            'id' => $student->id,
            'name' => trim(($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? '')),
            'class' => $student->schoolClass?->name,
            'grade_level' => $student->gradeLevel?->name,
        ];

        $yearData = $year !== null
            ? ['id' => $year->id, 'name' => $year->name]
            : ['id' => $student->academicYear?->id, 'name' => $student->academicYear?->name];

        $subjects = $this->subjectSummary($results);
        $overall = $this->overallPercentage($subjects);

        return [
            'student' => $studentData,
            'academic_year' => $yearData,
            'overall_percentage' => $overall,
            'pass_mark' => self::PASS_MARK,
            'passed' => $overall >= self::PASS_MARK,
            'grade_letter' => $this->gradeLetter($overall),
            'subjects' => $subjects,
            'exams' => $this->examBreakdown($results),
        ];
    }

    /**
     * Compute the final result for every student in the given collection.
     *
     * @param  Collection<int, Student>  $students
     * @return array<int, array<string, mixed>>
     */
    public function forStudents(Collection $students, ?AcademicYear $year = null): array
    {
        return $students
            ->map(fn (Student $student) => $this->forStudent($student, $year))
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, Exam>
     */
    private function applicableExams(Student $student, ?string $yearId): Collection
    {
        return Exam::query()
            ->where('status', ExamStatusEnum::PUBLISHED)
            ->where('academic_year_id', $yearId)
            ->where('grade_level_id', $student->grade_level_id)
            ->where(fn ($query) => $query->whereNull('class_id')->orWhere('class_id', $student->class_id))
            ->get();
    }

    /**
     * @param  Collection<int, ExamResult>  $results
     * @return array<int, array{subject: string, percentage: float, exams_count: int}>
     */
    private function subjectSummary(Collection $results): array
    {
        $subjects = [];

        foreach ($results as $result) {
            $subject = $result->exam->subject;
            $subjects[$subject]['score'] = ($subjects[$subject]['score'] ?? 0) + (float) $result->score;
            $subjects[$subject]['max'] = ($subjects[$subject]['max'] ?? 0) + (float) $result->exam->max_grade;
            $subjects[$subject]['count'] = ($subjects[$subject]['count'] ?? 0) + 1;
        }

        $rows = [];

        foreach ($subjects as $subject => $data) {
            $rows[] = [
                'subject' => $subject,
                'percentage' => $data['max'] > 0 ? round(($data['score'] / $data['max']) * 100, 2) : 0.00,
                'exams_count' => $data['count'],
            ];
        }

        return $rows;
    }

    /**
     * @param  array<int, array<string, mixed>>  $subjects
     */
    private function overallPercentage(array $subjects): float
    {
        if (count($subjects) === 0) {
            return 0.00;
        }

        return round(array_sum(array_column($subjects, 'percentage')) / count($subjects), 2);
    }

    private function gradeLetter(float $percentage): string
    {
        return match (true) {
            $percentage >= 90 => 'A',
            $percentage >= 80 => 'B',
            $percentage >= 70 => 'C',
            $percentage >= self::PASS_MARK => 'D',
            default => 'F',
        };
    }

    /**
     * @param  Collection<int, ExamResult>  $results
     * @return array<int, array<string, mixed>>
     */
    private function examBreakdown(Collection $results): array
    {
        return $results
            ->sortByDesc(fn (ExamResult $result) => $result->exam->exam_date)
            ->map(fn (ExamResult $result) => [
                'exam_id' => $result->exam->id,
                'exam_name' => $result->exam->name,
                'exam_type' => $result->exam->exam_type,
                'subject' => $result->exam->subject,
                'exam_date' => $result->exam->exam_date?->toDateString(),
                'max_grade' => (float) $result->exam->max_grade,
                'score' => (float) $result->score,
                'percentage' => $result->percentage,
                'status' => $result->status,
            ])
            ->values()
            ->all();
    }
}