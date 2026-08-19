<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'first_name' => 'System',
            'last_name' => 'Administrator',
            'email' => 'admin@school.test',
            'phone' => '01000000000',
            'password' => 'password',
        ]);
    }
}