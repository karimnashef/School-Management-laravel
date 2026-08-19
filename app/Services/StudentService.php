<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Student::query()
            ->with(['user', 'schoolClass.gradeLevel', 'gradeLevel', 'academicYear'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Student
    {
        $this->assertClassHasCapacity($data['class_id']);

        return Student::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Student $student, array $data): Student
    {
        if (isset($data['class_id']) && $data['class_id'] !== $student->class_id) {
            $this->assertClassHasCapacity($data['class_id'], $student);
        }

        $student->update($data);

        return $student;
    }

    public function delete(Student $student): void
    {
        $student->delete();
    }

    public function restore(Student $student): Student
    {
        $student->restore();

        return $student;
    }

    private function assertClassHasCapacity(string $classId, ?Student $exclude = null): void
    {
        $class = SchoolClass::findOrFail($classId);

        if ($class->capacity === null) {
            return;
        }

        $count = Student::query()
            ->where('class_id', $classId)
            ->when($exclude !== null, fn ($query) => $query->where('id', '!=', $exclude->id))
            ->count();

        if ($count >= $class->capacity) {
            throw new DomainException("Class \"{$class->name}\" is already full.", 422);
        }
    }
}