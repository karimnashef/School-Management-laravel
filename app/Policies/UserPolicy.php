<?php

namespace App\Policies;

use App\Enums\UserRoleEnum;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function view(User $user, User $target): bool
    {
        return $user->role === UserRoleEnum::ADMIN || $user->id === $target->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function update(User $user, User $target): bool
    {
        if ($user->role !== UserRoleEnum::ADMIN) {
            return false;
        }

        return $user->id !== $target->id;
    }

    public function delete(User $user, User $target): bool
    {
        if ($user->role !== UserRoleEnum::ADMIN) {
            return false;
        }

        return $user->id !== $target->id;
    }
}