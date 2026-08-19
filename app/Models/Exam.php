<?php

namespace App\Models;

use App\Enums\ExamStatusEnum;
use App\Enums\ExamTypeEnum;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'exam_type',
        'name',
        'subject',
        'class_id',
        'grade_level_id',
        'academic_year_id',
        'department_id',
        'exam_date',
        'max_grade',
        'status',
    ];

    protected $casts = [
        'exam_date' => 'date',
        'max_grade' => 'decimal:2',
        'exam_type' => ExamTypeEnum::class,
        'status' => ExamStatusEnum::class,
    ];

    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }
}