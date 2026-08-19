<?php

namespace App\Http\Requests\Student;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoleEnum::ADMIN;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'class_id' => ['required', 'uuid', 'exists:school_classes,id'],
            'grade_level_id' => ['required', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'admission_date' => ['required', 'date'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'blood_group' => ['nullable', 'string', 'max:10'],
        ];
    }
}