<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\Department;
use App\Models\User;

class DepartmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Department $department): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function update(User $user, Department $department): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function delete(User $user, Department $department): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}