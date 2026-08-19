<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, Attendance $attendance): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::STUDENT) {
            return $attendance->student_id === $user->student?->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function update(User $user, Attendance $attendance): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function delete(User $user, Attendance $attendance): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}