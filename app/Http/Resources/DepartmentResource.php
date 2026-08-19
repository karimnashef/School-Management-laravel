<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'max_grade' => $this->max_grade === null
                ? null
                : (float) number_format((float) $this->max_grade, 2, '.', ''),
            'min_grade' => $this->min_grade === null
                ? null
                : (float) number_format((float) $this->min_grade, 2, '.', ''),
            'teachers_count' => $this->whenCounted('teachers'),
            'grades_count' => $this->whenCounted('grades'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
