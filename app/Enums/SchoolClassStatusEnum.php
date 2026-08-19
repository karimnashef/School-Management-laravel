<?php

namespace App\Enums;

enum SchoolClassStatusEnum: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case MAINTENANCE = 'maintenance';
}
