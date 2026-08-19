<?php

namespace App\Services;

use App\Models\SchoolClass;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SchoolClassService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return SchoolClass::query()
            ->with(['gradeLevel', 'academicYear'])
            ->withCount('students')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): SchoolClass
    {
        return SchoolClass::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(SchoolClass $class, array $data): SchoolClass
    {
        $class->update($data);

        return $class;
    }

    public function delete(SchoolClass $class): void
    {
        $class->delete();
    }
}