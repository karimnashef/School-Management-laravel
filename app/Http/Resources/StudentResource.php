<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'class_id' => $this->class_id,
            'grade_level_id' => $this->grade_level_id,
            'academic_year_id' => $this->academic_year_id,
            'admission_date' => $this->admission_date?->toDateString(),
            'age' => $this->age,
            'blood_group' => $this->blood_group,
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'class' => $this->whenLoaded('schoolClass', fn () => new SchoolClassResource($this->schoolClass)),
            'grade_level' => $this->whenLoaded('gradeLevel', fn () => new GradeLevelResource($this->gradeLevel)),
            'academic_year' => $this->whenLoaded('academicYear', fn () => new AcademicYearResource($this->academicYear)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
