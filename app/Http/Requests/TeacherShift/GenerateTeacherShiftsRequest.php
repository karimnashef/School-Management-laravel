<?php

namespace App\Http\Requests\TeacherShift;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class GenerateTeacherShiftsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'class_ids' => ['required', 'array', 'min:1'],
            'class_ids.*' => ['required', 'uuid', 'exists:school_classes,id'],
            'teacher_ids' => ['nullable', 'array'],
            'teacher_ids.*' => ['required', 'uuid', 'exists:teachers,id'],
            'days_of_week' => ['nullable', 'array', 'min:1'],
            'days_of_week.*' => ['required', 'integer', 'between:1,7'],
            'replace_existing' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'end_time.after' => 'The end time must be after the start time.',
            'class_ids.required' => 'At least one class is required to generate a schedule.',
            'class_ids.*.exists' => 'One of the selected classes does not exist.',
            'teacher_ids.*.exists' => 'One of the selected teachers does not exist.',
        ];
    }
}