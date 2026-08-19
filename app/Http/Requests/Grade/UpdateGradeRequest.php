<?php

namespace App\Http\Requests\Grade;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'uuid', 'exists:students,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'grade_level_id' => ['sometimes', 'uuid', 'exists:grade_levels,id'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'grade' => ['sometimes', 'integer', 'min:0'],
            'result' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}