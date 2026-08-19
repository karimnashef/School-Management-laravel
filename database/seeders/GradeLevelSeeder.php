<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use Illuminate\Database\Seeder;

class GradeLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['name' => 'Grade 1', 'level' => 1, 'stage' => 'Primary', 'description' => 'First year of primary school'],
            ['name' => 'Grade 2', 'level' => 2, 'stage' => 'Primary', 'description' => 'Second year of primary school'],
            ['name' => 'Grade 3', 'level' => 3, 'stage' => 'Primary', 'description' => 'Third year of primary school'],
        ];

        foreach ($levels as $level) {
            GradeLevel::updateOrCreate(['name' => $level['name']], $level);
        }
    }
}