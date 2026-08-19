<?php

namespace App\Services;

use App\Enums\ExamStatusEnum;
use App\Models\Exam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExamService
{
    public function paginate(int $perPage = 15, ?string $academicYearId = null): LengthAwarePaginator
    {
        return Exam::query()
            ->with(['gradeLevel', 'academicYear', 'department'])
            ->when($academicYearId !== null, fn ($query) => $query->where('academic_year_id', $academicYearId))
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Exam
    {
        return Exam::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Exam $exam, array $data): Exam
    {
        $exam->update($data);

        return $exam;
    }

    public function delete(Exam $exam): void
    {
        $exam->delete();
    }

    public function publish(Exam $exam): Exam
    {
        $exam->update(['status' => ExamStatusEnum::PUBLISHED]);

        return $exam;
    }
}