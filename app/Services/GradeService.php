<?php

namespace App\Services;

use App\Models\Grade;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GradeService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Grade::query()
            ->with(['student.user', 'department', 'academicYear', 'gradeLevel'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Grade
    {
        return Grade::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Grade $grade, array $data): Grade
    {
        $grade->update($data);

        return $grade;
    }

    public function delete(Grade $grade): void
    {
        $grade->delete();
    }
}