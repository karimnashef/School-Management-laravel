<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'academic_year_id' => $this->academic_year_id,
            'grade_level_id' => $this->grade_level_id,
            'department_id' => $this->department_id,
            'name' => $this->name,
            'grade' => $this->grade,
            'percentage' => $this->percentage,
            'result' => $this->result,
            'description' => $this->description,
            'student' => $this->whenLoaded('student', fn () => new StudentResource($this->student)),
            'department' => $this->whenLoaded('department', fn () => new DepartmentResource($this->department)),
            'academic_year' => $this->whenLoaded('academicYear', fn () => new AcademicYearResource($this->academicYear)),
            'grade_level' => $this->whenLoaded('gradeLevel', fn () => new GradeLevelResource($this->gradeLevel)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
