<?php

namespace App\Http\Requests\ExamResult;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class BulkStoreExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['required', 'uuid', 'exists:exams,id'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'uuid', 'distinct', 'exists:students,id'],
            'records.*.score' => ['required', 'numeric', 'min:0'],
            'records.*.remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}