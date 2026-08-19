<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Mathematics', 'description' => 'Mathematics and arithmetic', 'max_grade' => 100, 'min_grade' => 0],
            ['name' => 'Science', 'description' => 'Physics, chemistry and biology', 'max_grade' => 100, 'min_grade' => 0],
            ['name' => 'Languages', 'description' => 'Arabic and English languages', 'max_grade' => 100, 'min_grade' => 0],
            ['name' => 'Arts', 'description' => 'Art and music education', 'max_grade' => 100, 'min_grade' => 0],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(['name' => $department['name']], $department);
        }
    }
}