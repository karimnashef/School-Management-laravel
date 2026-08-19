<?php

namespace App\Services;

use App\Enums\TeacherShiftStatusEnum;
use App\Exceptions\DomainException;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherShift;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TeacherShiftService
{
    public function paginate(
        int $perPage = 15,
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $teacherId = null,
        ?string $classId = null
    ): LengthAwarePaginator {
        return TeacherShift::query()
            ->with(['teacher.user', 'class.gradeLevel', 'switchTo.user'])
            ->when($fromDate !== null, fn ($query) => $query->whereDate('shift_date', '>=', $fromDate))
            ->when($toDate !== null, fn ($query) => $query->whereDate('shift_date', '<=', $toDate))
            ->when($teacherId !== null, fn ($query) => $query->where('teacher_id', $teacherId))
            ->when($classId !== null, fn ($query) => $query->where('class_id', $classId))
            ->orderBy('shift_date')
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

    /**
     * Auto-generate a schedule for the given classes and date range.
     *
     * @param  array{start_date: string, end_date: string, start_time: string, end_time: string, class_ids: array<int, string>, teacher_ids?: array<int, string>|null, days_of_week?: array<int, int>|null, replace_existing?: bool|null}  $data
     * @return array<int, TeacherShift>
     */
    public function generate(array $data): array
    {
        $start = Carbon::parse($data['start_date'])->startOfDay();
        $end = Carbon::parse($data['end_date'])->startOfDay();
        $startTime = Carbon::parse($data['start_time'])->format('H:i:s');
        $endTime = Carbon::parse($data['end_time'])->format('H:i:s');
        $days = $data['days_of_week'] ?? [1, 2, 3, 4, 5];
        $replace = (bool) ($data['replace_existing'] ?? false);

        if ($start->diffInDays($end) > 62) {
            throw new DomainException('The date range cannot exceed 62 days.', 422);
        }

        $classes = SchoolClass::query()
            ->whereIn('id', $data['class_ids'])
            ->orderBy('name')
            ->get();

        $teachers = Teacher::query()
            ->with('user')
            ->when(! empty($data['teacher_ids']), fn ($query) => $query->whereIn('id', $data['teacher_ids']))
            ->orderBy('id')
            ->get();

        if ($classes->isEmpty()) {
            throw new DomainException('No classes match the request.', 422);
        }

        if ($teachers->isEmpty()) {
            throw new DomainException('No teachers available to schedule.', 422);
        }

        return DB::transaction(function () use ($start, $end, $startTime, $endTime, $days, $replace, $classes, $teachers): array {
            if ($replace) {
                TeacherShift::query()
                    ->whereIn('class_id', $classes->pluck('id'))
                    ->whereDate('shift_date', '>=', $start)
                    ->whereDate('shift_date', '<=', $end)
                    ->delete();
            }

            $planned = [];

            foreach ($start->toPeriod($end, 1, 'day') as $day) {
                if (! in_array($day->dayOfWeekIso, $days, true)) {
                    continue;
                }

                foreach ($classes as $class) {
                    $teacher = $this->pickTeacher($teachers, $day, $startTime, $endTime, collect($planned));

                    $planned[] = [
                        'teacher_id' => $teacher->id,
                        'class_id' => $class->id,
                        'shift_date' => $day->format('Y-m-d'),
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'status' => TeacherShiftStatusEnum::SCHEDULED,
                        'notes' => 'Auto-generated schedule',
                    ];
                }
            }

            $created = [];

            foreach ($planned as $attributes) {
                $created[] = TeacherShift::create($attributes);
            }

            return $created;
        });
    }

    private function assertNoOverlap(string $teacherId, string $date, string $start, string $end, ?string $ignoreId = null): void
    {
        if ($this->hasOverlap($teacherId, $date, $start, $end, $ignoreId)) {
            throw new DomainException('The teacher already has a shift overlapping this time slot.', 422);
        }
    }

    private function hasOverlap(string $teacherId, string $date, string $start, string $end, ?string $ignoreId = null): bool
    {
        $startTime = Carbon::parse($start)->format('H:i:s');
        $endTime = Carbon::parse($end)->format('H:i:s');

        return TeacherShift::query()
            ->where('teacher_id', $teacherId)
            ->where('shift_date', $date)
            ->where('status', '!=', TeacherShiftStatusEnum::CANCELLED->value)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get()
            ->contains(function (TeacherShift $shift) use ($startTime, $endTime): bool {
                $existingStart = $shift->start_time->format('H:i:s');
                $existingEnd = $shift->end_time->format('H:i:s');

                return $startTime < $existingEnd && $endTime > $existingStart;
            });
    }

    /**
     * @param  Collection<int, Teacher>  $teachers
     * @param  Collection<int, array<string, mixed>>  $generated
     */
    private function pickTeacher(Collection $teachers, Carbon $day, string $startTime, string $endTime, Collection $generated): Teacher
    {
        $dateStr = $day->format('Y-m-d');

        $eligible = $teachers->filter(function (Teacher $teacher) use ($dateStr, $startTime, $endTime, $day, $generated): bool {
            if ($teacher->required_shifts_per_week !== null && (int) $teacher->required_shifts_per_week > 0) {
                $cap = (int) $teacher->required_shifts_per_week;

                if ($this->weeklyShiftCount($teacher->id, $day, $generated) >= $cap) {
                    return false;
                }
            }

            if ($this->hasOverlap($teacher->id, $dateStr, $startTime, $endTime)) {
                return false;
            }

            return ! $generated->contains(
                fn (array $shift) => $shift['teacher_id'] === $teacher->id && $shift['shift_date'] === $dateStr
            );
        });

        if ($eligible->isEmpty()) {
            throw new DomainException(
                "No available teacher for {$dateStr} — every teacher is busy or has reached the weekly shift limit.",
                422
            );
        }

        return $eligible
            ->sortBy(fn (Teacher $teacher) => $generated->filter(fn (array $shift) => $shift['teacher_id'] === $teacher->id)->count())
            ->first();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $generated
     */
    private function weeklyShiftCount(string $teacherId, Carbon $day, Collection $generated): int
    {
        $weekStart = $day->copy()->startOfWeek()->format('Y-m-d');
        $weekEnd = $day->copy()->startOfWeek()->addDays(6)->format('Y-m-d');

        $dbCount = TeacherShift::query()
            ->where('teacher_id', $teacherId)
            ->whereBetween('shift_date', [$weekStart, $weekEnd])
            ->where('status', '!=', TeacherShiftStatusEnum::CANCELLED->value)
            ->count();

        $generatedCount = $generated
            ->filter(fn (array $shift) => $shift['teacher_id'] === $teacherId
                && $shift['shift_date'] >= $weekStart
                && $shift['shift_date'] <= $weekEnd)
            ->count();

        return $dbCount + $generatedCount;
    }
}