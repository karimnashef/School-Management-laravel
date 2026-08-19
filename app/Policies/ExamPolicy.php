<?php

namespace App\Policies;

use App\Enums\ExamStatusEnum;
use App\Enums\UserRoleEnum;
use App\Models\Exam;
use App\Models\User;

class ExamPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function view(User $user, Exam $exam): bool
    {
        if ($user->role === UserRoleEnum::ADMIN) {
            return true;
        }

        if ($user->role === UserRoleEnum::TEACHER) {
            return true;
        }

        if ($user->role === UserRoleEnum::STUDENT) {
            $student = $user->student;

            if ($student === null || $exam->status !== ExamStatusEnum::PUBLISHED) {
                return false;
            }

            return $exam->academic_year_id === $student->academic_year_id
                && ($exam->class_id === null || $exam->class_id === $student->class_id);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function update(User $user, Exam $exam): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $user->role === UserRoleEnum::ADMIN;
    }

    public function publish(User $user, Exam $exam): bool
    {
        return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }
}