<?php

namespace App\Services;

use App\Models\GradeLevel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GradeLevelService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return GradeLevel::query()
            ->withCount(['classes', 'students'])
            ->orderBy('level')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): GradeLevel
    {
        return GradeLevel::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(GradeLevel $gradeLevel, array $data): GradeLevel
    {
        $gradeLevel->update($data);

        return $gradeLevel;
    }

    public function delete(GradeLevel $gradeLevel): void
    {
        $gradeLevel->delete();
    }
}