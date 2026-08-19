<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'grade_level_id' => $this->grade_level_id,
            'academic_year_id' => $this->academic_year_id,
            'name' => $this->name,
            'description' => $this->description,
            'capacity' => $this->capacity,
            'status' => $this->status?->value ?? $this->status,
            'type' => $this->type?->value ?? $this->type,
            'grade_level' => $this->whenLoaded('gradeLevel', fn () => new GradeLevelResource($this->gradeLevel)),
            'academic_year' => $this->whenLoaded('academicYear', fn () => new AcademicYearResource($this->academicYear)),
            'students_count' => $this->whenCounted('students'),
            'shifts_count' => $this->whenCounted('shifts'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
