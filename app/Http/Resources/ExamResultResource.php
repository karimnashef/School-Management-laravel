<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_id' => $this->exam_id,
            'student_id' => $this->student_id,
            'score' => (float) $this->score,
            'max_grade' => $this->whenLoaded('exam', fn () => (float) $this->exam->max_grade),
            'percentage' => $this->percentage,
            'status' => $this->status,
            'remarks' => $this->remarks,
            'exam' => $this->whenLoaded('exam', fn () => new ExamResource($this->exam)),
            'student' => $this->whenLoaded('student', fn () => new StudentResource($this->student)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}