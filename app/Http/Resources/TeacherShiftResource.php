<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherShiftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher_id' => $this->teacher_id,
            'class_id' => $this->class_id,
            'switch_to_id' => $this->switch_to_id,
            'shift_date' => $this->shift_date?->toDateString(),
            'start_time' => $this->start_time?->format('H:i'),
            'end_time' => $this->end_time?->format('H:i'),
            'status' => $this->status?->value ?? $this->status,
            'notes' => $this->notes,
            'teacher' => $this->whenLoaded('teacher', fn () => new TeacherResource($this->teacher)),
            'class' => $this->whenLoaded('class', fn () => new SchoolClassResource($this->class)),
            'switch_to' => $this->whenLoaded('switchTo', fn () => new TeacherResource($this->switchTo)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
