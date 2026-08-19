<?php

namespace App\Enums;

enum ExamTypeEnum: string
{
    case QUIZ = 'quiz';
    case MIDTERM = 'midterm';
    case FINAL = 'final';
}