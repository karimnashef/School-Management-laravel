<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $mathematics = Department::where('name', 'Mathematics')->firstOrFail();
        $science = Department::where('name', 'Science')->firstOrFail();
        $languages = Department::where('name', 'Languages')->firstOrFail();

        $teachers = [
            [
                'first_name' => 'Ahmed',
                'last_name' => 'Hassan',
                'email' => 'ahmed.hassan@school.test',
                'department_id' => $mathematics->id,
                'qualification' => 'BSc Mathematics',
                'required_shifts_per_week' => 5,
                'price_per_shift' => 150.00,
            ],
            [
                'first_name' => 'Mona',
                'last_name' => 'Ibrahim',
                'email' => 'mona.ibrahim@school.test',
                'department_id' => $science->id,
                'qualification' => 'BSc Science',
                'required_shifts_per_week' => 5,
                'price_per_shift' => 140.00,
            ],
            [
                'first_name' => 'Sara',
                'last_name' => 'Khaled',
                'email' => 'sara.khaled@school.test',
                'department_id' => $languages->id,
                'qualification' => 'BA English Literature',
                'required_shifts_per_week' => 5,
                'price_per_shift' => 130.00,
            ],
        ];

        foreach ($teachers as $teacher) {
            $user = User::factory()->teacher()->create([
                'first_name' => $teacher['first_name'],
                'last_name' => $teacher['last_name'],
                'email' => $teacher['email'],
                'phone' => fake()->unique()->phoneNumber(),
            ]);

            Teacher::updateOrCreate(['user_id' => $user->id], [
                'user_id' => $user->id,
                'department_id' => $teacher['department_id'],
                'qualification' => $teacher['qualification'],
                'join_date' => '2024-09-01',
                'required_shifts_per_week' => $teacher['required_shifts_per_week'],
                'price_per_shift' => $teacher['price_per_shift'],
            ]);
        }
    }
}