<?php

namespace App\Models;

use App\Enums\SchoolClassStatusEnum;
use App\Enums\SchoolClassTypeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'description',
        'grade_level_id',
        'academic_year_id',
        'capacity',
        'status',
        'type'
    ];

    protected $casts = [
        'capacity' => 'integer',
        'status' => SchoolClassStatusEnum::class,
        'type' => SchoolClassTypeEnum::class
    ];

    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function shifts()
    {
        return $this->hasMany(TeacherShift::class , 'class_id');
    }

}
