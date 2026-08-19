<?php

namespace App\Services;

use App\Enums\ExamResultStatusEnum;
use App\Exceptions\DomainException;
use App\Models\Exam;
use App\Models\ExamResult;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ExamResultService
{
    public function paginate(int $perPage = 15, ?string $examId = null, ?string $studentId = null): LengthAwarePaginator
    {
        return ExamResult::query()
            ->with(['exam.gradeLevel', 'student.user'])
            ->when($examId !== null, fn ($query) => $query->where('exam_id', $examId))
            ->when($studentId !== null, fn ($query) => $query->where('student_id', $studentId))
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ExamResult
    {
        $exam = Exam::findOrFail($data['exam_id']);

        $this->assertNotDuplicated($data['exam_id'], $data['student_id']);

        $data['status'] = $this->resolveStatus((float) $data['score'], (float) $exam->max_grade);

        return ExamResult::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ExamResult $result, array $data): ExamResult
    {
        $score = $data['score'] ?? $result->score;
        $exam = Exam::findOrFail($result->exam_id);

        $data['status'] = $this->resolveStatus((float) $score, (float) $exam->max_grade);

        $result->update($data);

        return $result;
    }

    /**
     * @param  array{exam_id: string, records: array<int, array{student_id: string, score: float|int, remarks?: string|null}>}  $data
     * @return array<int, ExamResult>
     */
    public function bulkCreate(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $exam = Exam::findOrFail($data['exam_id']);
            $created = [];

            foreach ($data['records'] as $record) {
                $this->assertNotDuplicated($data['exam_id'], $record['student_id']);

                $created[] = ExamResult::create([
                    'exam_id' => $data['exam_id'],
                    'student_id' => $record['student_id'],
                    'score' => $record['score'],
                    'status' => $this->resolveStatus((float) $record['score'], (float) $exam->max_grade),
                    'remarks' => $record['remarks'] ?? null,
                ]);
            }

            return $created;
        });
    }

    public function delete(ExamResult $result): void
    {
        $result->delete();
    }

    private function resolveStatus(float $score, float $maxGrade): ExamResultStatusEnum
    {
        return $score >= $maxGrade * 0.5
            ? ExamResultStatusEnum::PASSED
            : ExamResultStatusEnum::FAILED;
    }

    private function assertNotDuplicated(string $examId, string $studentId, ?string $ignoreId = null): void
    {
        $exists = ExamResult::query()
            ->where('exam_id', $examId)
            ->where('student_id', $studentId)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw new DomainException('This student already has a result for this exam.', 422);
        }
    }
}