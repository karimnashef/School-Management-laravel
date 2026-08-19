<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_type' => $this->exam_type,
            'name' => $this->name,
            'subject' => $this->subject,
            'class_id' => $this->class_id,
            'grade_level_id' => $this->grade_level_id,
            'academic_year_id' => $this->academic_year_id,
            'department_id' => $this->department_id,
            'exam_date' => $this->exam_date?->toDateString(),
            'max_grade' => (float) $this->max_grade,
            'status' => $this->status,
            'results_count' => $this->whenCounted('results'),
            'class' => $this->whenLoaded('class', fn () => new SchoolClassResource($this->class)),
            'grade_level' => $this->whenLoaded('gradeLevel', fn () => new GradeLevelResource($this->gradeLevel)),
            'academic_year' => $this->whenLoaded('academicYear', fn () => new AcademicYearResource($this->academicYear)),
            'department' => $this->whenLoaded('department', fn () => new DepartmentResource($this->department)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}