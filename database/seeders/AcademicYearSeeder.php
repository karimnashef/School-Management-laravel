<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        AcademicYear::updateOrCreate(['name' => '2024/2025'], [
            'name' => '2024/2025',
            'start_date' => '2024-09-01',
            'end_date' => '2025-06-30',
            'is_current' => false,
        ]);

        AcademicYear::updateOrCreate(['name' => '2025/2026'], [
            'name' => '2025/2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);
    }
}