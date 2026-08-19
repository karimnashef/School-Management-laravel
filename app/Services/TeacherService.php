<?php

namespace App\Services;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Teacher::query()
            ->with(['user', 'department'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Teacher
    {
        return Teacher::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Teacher $teacher, array $data): Teacher
    {
        $teacher->update($data);

        return $teacher;
    }

    public function delete(Teacher $teacher): void
    {
        $teacher->delete();
    }
}