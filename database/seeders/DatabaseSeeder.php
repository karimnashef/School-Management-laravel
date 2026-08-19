<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            GradeLevelSeeder::class,
            AcademicYearSeeder::class,
            DepartmentSeeder::class,
            AdminSeeder::class,
            SchoolClassSeeder::class,
            TeacherSeeder::class,
            StudentSeeder::class,
            TeacherShiftSeeder::class,
            AttendanceSeeder::class,
            GradeSeeder::class,
            ExamSeeder::class,
            ExamResultSeeder::class,
        ]);
    }
}