<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\Teacher;
use App\Models\User;

class TeacherPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, Teacher $teacher): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::TEACHER) {
            return $teacher->user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function update(User $user, Teacher $teacher): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function delete(User $user, Teacher $teacher): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}