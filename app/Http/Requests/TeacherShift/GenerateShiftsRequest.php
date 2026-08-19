<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateShiftsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_ids' => ['required', 'array', 'min:1'],
            'teacher_ids.*' => ['required', 'uuid', 'exists:teachers,id'],

            'class_ids' => ['nullable', 'array', 'min:1'],
            'class_ids.*' => ['required', 'uuid', 'exists:school_classes,id'],

            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],

            'time_slots' => ['required', 'array', 'min:1'],
            'time_slots.*.start_time' => ['required_with:time_slots', 'date_format:H:i:s'],
            'time_slots.*.end_time' => ['required_with:time_slots', 'date_format:H:i:s', 'after:time_slots.*.start_time'],
        ];
    }
}
