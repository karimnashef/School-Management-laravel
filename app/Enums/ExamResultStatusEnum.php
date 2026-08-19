<?php

namespace App\Enums;

enum ExamResultStatusEnum: string
{
    case PASSED = 'passed';
    case FAILED = 'failed';
}