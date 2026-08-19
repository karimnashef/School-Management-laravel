<?php

namespace App\Http\Requests\ExamResult;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['required', 'uuid', 'exists:exams,id'],
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'score' => ['required', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}