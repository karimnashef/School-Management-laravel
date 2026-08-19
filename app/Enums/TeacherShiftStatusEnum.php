<?php

namespace App\Enums;

enum TeacherShiftStatusEnum: string
{
    case SCHEDULED = 'scheduled';
    case COMPLETED = 'completed';
    case ABSENT = 'absent';
    case CANCELLED = 'cancelled';
}
