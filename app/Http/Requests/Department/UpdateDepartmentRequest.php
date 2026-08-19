<?php

namespace App\Http\Requests\Department;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoleEnum::ADMIN;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($this->route('department'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'max_grade' => ['nullable', 'numeric', 'min:0'],
            'min_grade' => ['nullable', 'numeric', 'min:0', 'lte:max_grade'],
        ];
    }

    public function messages(): array
    {
        return [
            'min_grade.lte' => 'The minimum grade must be less than or equal to the maximum grade.',
        ];
    }
}