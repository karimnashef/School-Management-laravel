<?php

namespace App\Models;

use App\Enums\ExamResultStatusEnum;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExamResult extends Model
{
    use HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'exam_id',
        'student_id',
        'score',
        'status',
        'remarks',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'status' => ExamResultStatusEnum::class,
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function getPercentageAttribute(): float
    {
        $maxGrade = $this->exam?->max_grade ?? 0;

        if ((float) $maxGrade <= 0) {
            return 0.00;
        }

        return round(((float) $this->score / (float) $maxGrade) * 100, 2);
    }
}