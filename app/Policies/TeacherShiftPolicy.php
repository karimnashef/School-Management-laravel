<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\TeacherShift;
use App\Models\User;

class TeacherShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, TeacherShift $shift): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::TEACHER) {
            return $shift->teacher_id === $user->teacher?->id || $shift->switch_to_id === $user->teacher?->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function update(User $user, TeacherShift $shift): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function delete(User $user, TeacherShift $shift): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}