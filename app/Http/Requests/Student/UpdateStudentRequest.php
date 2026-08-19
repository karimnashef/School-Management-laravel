<?php

namespace App\Http\Requests\Student;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoleEnum::ADMIN;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'uuid', 'exists:users,id'],
            'class_id' => ['sometimes', 'uuid', 'exists:school_classes,id'],
            'grade_level_id' => ['sometimes', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'admission_date' => ['sometimes', 'date'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'blood_group' => ['nullable', 'string', 'max:10'],
        ];
    }
}