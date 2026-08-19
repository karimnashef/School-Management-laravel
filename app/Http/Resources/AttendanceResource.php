<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'shift_id' => $this->shift_id,
            'attendance_date' => $this->attendance_date?->toDateString(),
            'status' => $this->status?->value ?? $this->status,
            'notes' => $this->notes,
            'student' => $this->whenLoaded('student', fn () => new StudentResource($this->student)),
            'shift' => $this->whenLoaded('shift', fn () => new TeacherShiftResource($this->shift)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
