<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\ExamResult;
use App\Models\User;

class ExamResultPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, ExamResult $result): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::TEACHER) {
            return true;
        }

        if ($user->role === UserRoleEnum::STUDENT) {
            return $result->student_id === $user->student?->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function update(User $user, ExamResult $result): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function delete(User $user, ExamResult $result): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}