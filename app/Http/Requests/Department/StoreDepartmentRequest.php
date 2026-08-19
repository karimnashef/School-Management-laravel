<?php

namespace App\Http\Requests\Department;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoleEnum::ADMIN;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'description' => ['nullable', 'string', 'max:2000'],
            'max_grade' => ['nullable', 'numeric', 'min:0'],
            'min_grade' => ['nullable', 'numeric', 'min:0', 'lte:max_grade'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A department with this name already exists.',
            'min_grade.lte' => 'The minimum grade must be less than or equal to the maximum grade.',
        ];
    }
}