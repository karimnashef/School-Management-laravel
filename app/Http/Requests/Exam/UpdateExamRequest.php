<?php

namespace App\Http\Requests\Exam;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'exam_type' => ['sometimes', 'string', 'in:quiz,midterm,final'],
            'name' => ['sometimes', 'string', 'max:255'],
            'subject' => ['sometimes', 'string', 'max:255'],
            'class_id' => ['nullable', 'uuid', 'exists:school_classes,id'],
            'grade_level_id' => ['sometimes', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'exam_date' => ['sometimes', 'date'],
            'max_grade' => ['sometimes', 'numeric', 'min:1'],
        ];
    }
}