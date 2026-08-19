<?php

namespace Database\Seeders;

use App\Enums\TeacherShiftStatusEnum;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\TeacherShift;
use Illuminate\Database\Seeder;

class TeacherShiftSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = Teacher::all();
        $classes = SchoolClass::all();

        $days = ['2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14'];

        foreach ($days as $day) {
            foreach ($classes as $class) {
                $teacher = $teachers->random();

                TeacherShift::updateOrCreate(
                    ['teacher_id' => $teacher->id, 'class_id' => $class->id, 'shift_date' => $day],
                    [
                        'teacher_id' => $teacher->id,
                        'class_id' => $class->id,
                        'shift_date' => $day,
                        'start_time' => '08:00:00',
                        'end_time' => '10:00:00',
                        'status' => TeacherShiftStatusEnum::COMPLETED,
                        'notes' => null,
                    ]
                );
            }
        }
    }
}