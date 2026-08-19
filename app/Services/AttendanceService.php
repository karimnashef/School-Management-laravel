<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Attendance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Attendance::query()
            ->with(['student.user', 'shift.class', 'shift.teacher.user'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Attendance
    {
        $this->assertNotDuplicated($data['student_id'], $data['shift_id'], $data['attendance_date']);

        return Attendance::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Attendance $attendance, array $data): Attendance
    {
        $studentId = $data['student_id'] ?? $attendance->student_id;
        $shiftId = $data['shift_id'] ?? $attendance->shift_id;
        $date = $data['attendance_date'] ?? $attendance->attendance_date;

        $this->assertNotDuplicated($studentId, $shiftId, $date, $attendance->id);

        $attendance->update($data);

        return $attendance;
    }

    /**
     * @param  array{shift_id: string, attendance_date: string, records: array<int, array{student_id: string, status: string, notes?: string|null}>}  $data
     * @return array<int, Attendance>
     */
    public function bulkCreate(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $created = [];

            foreach ($data['records'] as $record) {
                $this->assertNotDuplicated($record['student_id'], $data['shift_id'], $data['attendance_date']);

                $created[] = Attendance::create([
                    'student_id' => $record['student_id'],
                    'shift_id' => $data['shift_id'],
                    'attendance_date' => $data['attendance_date'],
                    'status' => $record['status'],
                    'notes' => $record['notes'] ?? null,
                ]);
            }

            return $created;
        });
    }

    public function delete(Attendance $attendance): void
    {
        $attendance->delete();
    }

    private function assertNotDuplicated(string $studentId, string $shiftId, string $date, ?string $ignoreId = null): void
    {
        $exists = Attendance::query()
            ->where('student_id', $studentId)
            ->where('shift_id', $shiftId)
            ->where('attendance_date', $date)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw new DomainException('This student already has an attendance record for this shift and date.', 422);
        }
    }
}