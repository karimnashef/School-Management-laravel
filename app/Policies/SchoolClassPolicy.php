<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\SchoolClass;
use App\Models\User;

class SchoolClassPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, SchoolClass $class): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function update(User $user, SchoolClass $class): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function delete(User $user, SchoolClass $class): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}