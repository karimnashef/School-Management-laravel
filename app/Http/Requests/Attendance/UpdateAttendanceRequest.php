<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceStatusEnum;
use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'uuid', 'exists:students,id'],
            'shift_id' => ['sometimes', 'uuid', 'exists:teacher_shifts,id'],
            'attendance_date' => ['sometimes', 'date'],
            'status' => ['sometimes', Rule::enum(AttendanceStatusEnum::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}