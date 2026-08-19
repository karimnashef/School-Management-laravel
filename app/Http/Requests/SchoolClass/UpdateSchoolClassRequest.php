<?php

namespace App\Http\Requests\SchoolClass;

use App\Enums\SchoolClassStatusEnum;
use App\Enums\SchoolClassTypeEnum;
use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoleEnum::ADMIN;
    }

    public function rules(): array
    {
        return [
            'grade_level_id' => ['sometimes', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:500'],
            'status' => ['sometimes', Rule::enum(SchoolClassStatusEnum::class)],
            'type' => ['sometimes', Rule::enum(SchoolClassTypeEnum::class)],
        ];
    }
}