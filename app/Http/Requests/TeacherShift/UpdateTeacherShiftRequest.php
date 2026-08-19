<?php

namespace App\Http\Requests\TeacherShift;

use App\Enums\TeacherShiftStatusEnum;
use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'teacher_id' => ['sometimes', 'uuid', 'exists:teachers,id'],
            'class_id' => ['sometimes', 'uuid', 'exists:school_classes,id'],
            'switch_to_id' => ['nullable', 'uuid', 'different:teacher_id', 'exists:teachers,id'],
            'shift_date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'status' => ['sometimes', Rule::enum(TeacherShiftStatusEnum::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'end_time.after' => 'The end time must be after the start time.',
            'switch_to_id.different' => 'The substitute teacher must be different from the assigned teacher.',
        ];
    }
}