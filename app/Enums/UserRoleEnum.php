<?php

namespace App\Enums;

enum UserRoleEnum: string
{
    case STUDENT = 'student';
    case TEACHER = 'teacher';
    case ADMIN = 'admin';
}
