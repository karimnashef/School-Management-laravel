<?php

namespace App\Enums;

enum ExamStatusEnum: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
}