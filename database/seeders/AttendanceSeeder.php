<?php

namespace Database\Seeders;

use App\Enums\AttendanceStatusEnum;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\TeacherShift;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $shifts = TeacherShift::all();

        foreach ($shifts as $shift) {
            $students = SchoolClass::findOrFail($shift->class_id)->students;

            foreach ($students as $student) {
                Attendance::updateOrCreate(
                    ['student_id' => $student->id, 'shift_id' => $shift->id],
                    [
                        'student_id' => $student->id,
                        'shift_id' => $shift->id,
                        'attendance_date' => $shift->shift_date,
                        'status' => fake()->randomElement([
                            AttendanceStatusEnum::PRESENT,
                            AttendanceStatusEnum::PRESENT,
                            AttendanceStatusEnum::PRESENT,
                            AttendanceStatusEnum::LATE,
                            AttendanceStatusEnum::ABSENT,
                        ]),
                        'notes' => null,
                    ]
                );
            }
        }
    }
}