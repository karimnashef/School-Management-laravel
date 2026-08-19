<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceStatusEnum;
use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'shift_id' => ['required', 'uuid', 'exists:teacher_shifts,id'],
            'attendance_date' => ['required', 'date'],
            'status' => ['required', Rule::enum(AttendanceStatusEnum::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}