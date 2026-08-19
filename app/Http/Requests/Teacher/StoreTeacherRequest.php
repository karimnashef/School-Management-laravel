<?php

namespace App\Http\Requests\Teacher;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoleEnum::ADMIN;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'department_id' => ['required', 'uuid', 'exists:departments,id'],
            'qualification' => ['nullable', 'string', 'max:500'],
            'join_date' => ['required', 'date'],
            'required_shifts_per_week' => ['nullable', 'integer', 'min:1', 'max:50'],
            'price_per_shift' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}