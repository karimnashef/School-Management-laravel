<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\Grade;
use App\Models\User;

class GradePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, Grade $grade): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::STUDENT) {
            return $grade->student_id === $user->student?->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function update(User $user, Grade $grade): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function delete(User $user, Grade $grade): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}