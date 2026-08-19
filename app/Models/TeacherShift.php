<?php

namespace App\Models;

use App\Enums\TeacherShiftStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeacherShift extends Model
{
    use HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'teacher_id',
        'class_id',
        'switch_to_id',
        'shift_date',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    protected $casts = [
        'shift_date' => 'date',
        'start_time' => 'datetime:H:i:s',
        'end_time' => 'datetime:H:i:s',
        'status' => TeacherShiftStatusEnum::class
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class , 'shift_id');
    }

    public function switchTo(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'switch_to_id');
    }
}
