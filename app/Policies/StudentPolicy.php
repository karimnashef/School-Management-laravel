<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, Student $student): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::STUDENT) {
            return $student->user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function update(User $user, Student $student): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function delete(User $user, Student $student): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function restore(User $user, Student $student): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}