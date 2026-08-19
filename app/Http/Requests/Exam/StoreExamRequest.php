<?php

namespace App\Http\Requests\Exam;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'exam_type' => ['required', 'string', 'in:quiz,midterm,final'],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'class_id' => ['nullable', 'uuid', 'exists:school_classes,id'],
            'grade_level_id' => ['required', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'exam_date' => ['required', 'date'],
            'max_grade' => ['required', 'numeric', 'min:1'],
            'status' => ['sometimes', 'string', 'in:draft,published'],
        ];
    }
}