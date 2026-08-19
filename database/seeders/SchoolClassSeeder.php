<?php

namespace Database\Seeders;

use App\Enums\SchoolClassStatusEnum;
use App\Enums\SchoolClassTypeEnum;
use App\Models\AcademicYear;
use App\Models\GradeLevel;
use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('is_current', true)->firstOrFail();

        $classes = [
            ['name' => '1-A', 'grade_level' => 'Grade 1', 'capacity' => 30],
            ['name' => '2-A', 'grade_level' => 'Grade 2', 'capacity' => 30],
            ['name' => '3-A', 'grade_level' => 'Grade 3', 'capacity' => 30],
        ];

        foreach ($classes as $class) {
            $gradeLevel = GradeLevel::where('name', $class['grade_level'])->firstOrFail();

            SchoolClass::updateOrCreate(['name' => $class['name']], [
                'name' => $class['name'],
                'description' => "Class {$class['name']} - {$class['grade_level']}",
                'grade_level_id' => $gradeLevel->id,
                'academic_year_id' => $year->id,
                'capacity' => $class['capacity'],
                'status' => SchoolClassStatusEnum::ACTIVE,
                'type' => SchoolClassTypeEnum::GENDER_MIX,
            ]);
        }
    }
}