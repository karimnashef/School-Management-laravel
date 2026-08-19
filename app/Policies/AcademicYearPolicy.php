<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\AcademicYear;
use App\Models\User;

class AcademicYearPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AcademicYear $year): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function update(User $user, AcademicYear $year): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function delete(User $user, AcademicYear $year): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function setCurrent(User $user, AcademicYear $year): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }
}