<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::where('is_current', true)->firstOrFail();

        $names = [
            ['Omar', 'Mostafa'], ['Laila', 'Adel'], ['Youssef', 'Tarek'],
            ['Mariam', 'Samir'], ['Karim', 'Fawzy'], ['Nour', 'Hany'],
            ['Adam', 'Sherif'], ['Salma', 'Magdy'], ['Ali', 'Ezzat'],
        ];

        SchoolClass::all()->each(function (SchoolClass $class, int $index) use ($year, $names) {
            $students = array_slice($names, $index * 3, 3);

            foreach ($students as [$first, $last]) {
                $user = User::factory()->create([
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => strtolower("{$first}.{$last}") . '@school.test',
                    'phone' => fake()->unique()->phoneNumber(),
                ]);

                Student::updateOrCreate(['user_id' => $user->id], [
                    'user_id' => $user->id,
                    'class_id' => $class->id,
                    'academic_year_id' => $year->id,
                    'grade_level_id' => $class->grade_level_id,
                    'admission_date' => $year->start_date,
                    'age' => fake()->numberBetween(6, 12),
                    'blood_group' => fake()->randomElement(['A+', 'B+', 'O+', 'AB+']),
                ]);
            }
        });
    }
}