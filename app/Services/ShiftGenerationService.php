<?php


namespace App\Services;

use App\Models\Teacher;

class ShiftGenerationService
{
    public function generate(
        array $teacherIds,
        ?array $classIds,
        string $startDate,
        string $endDate,
        array $time_slots
    ) {
        $teachers = Teacher::find();
    }
}
