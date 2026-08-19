<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceStatusEnum;
use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'shift_id' => ['required', 'uuid', 'exists:teacher_shifts,id'],
            'attendance_date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1', 'max:500'],
            'records.*.student_id' => ['required', 'uuid', 'distinct', 'exists:students,id'],
            'records.*.status' => ['required', Rule::enum(AttendanceStatusEnum::class)],
            'records.*.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'records.required' => 'At least one attendance record is required.',
            'records.*.student_id.distinct' => 'A student cannot appear more than once in the same batch.',
        ];
    }
}