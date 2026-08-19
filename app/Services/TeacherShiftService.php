<?php

namespace App\Services;

use App\Enums\TeacherShiftStatusEnum;
use App\Exceptions\DomainException;
use App\Models\TeacherShift;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class TeacherShiftService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return TeacherShift::query()
            ->with(['teacher.user', 'class.gradeLevel', 'switchTo.user'])
            ->orderByDesc('shift_date')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): TeacherShift
    {
        $this->assertNoOverlap($data['teacher_id'], $data['shift_date'], $data['start_time'], $data['end_time']);

        return TeacherShift::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(TeacherShift $shift, array $data): TeacherShift
    {
        $teacherId = $data['teacher_id'] ?? $shift->teacher_id;
        $date = $data['shift_date'] ?? $shift->shift_date;
        $start = $data['start_time'] ?? $shift->start_time->format('H:i');
        $end = $data['end_time'] ?? $shift->end_time->format('H:i');

        $this->assertNoOverlap($teacherId, $date, $start, $end, $shift->id);

        $shift->update($data);

        return $shift;
    }

    public function delete(TeacherShift $shift): void
    {
        $shift->delete();
    }

    private function assertNoOverlap(string $teacherId, string $date, string $start, string $end, ?string $ignoreId = null): void
    {
        $startTime = Carbon::parse($start)->format('H:i:s');
        $endTime = Carbon::parse($end)->format('H:i:s');

        $overlapping = TeacherShift::query()
            ->where('teacher_id', $teacherId)
            ->where('shift_date', $date)
            ->where('status', '!=', TeacherShiftStatusEnum::CANCELLED->value)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get()
            ->filter(function (TeacherShift $shift) use ($startTime, $endTime): bool {
                $existingStart = $shift->start_time->format('H:i:s');
                $existingEnd = $shift->end_time->format('H:i:s');

                return $startTime < $existingEnd && $endTime > $existingStart;
            });

        if ($overlapping->isNotEmpty()) {
            throw new DomainException('The teacher already has a shift overlapping this time slot.', 422);
        }
    }
}