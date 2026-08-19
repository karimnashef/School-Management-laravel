<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'department_id' => $this->department_id,
            'qualification' => $this->qualification,
            'join_date' => $this->join_date?->toDateString(),
            'required_shifts_per_week' => $this->required_shifts_per_week,
            'price_per_shift' => $this->price_per_shift === null
                ? null
                : (float) number_format((float) $this->price_per_shift, 2, '.', ''),
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'department' => $this->whenLoaded('department', fn () => new DepartmentResource($this->department)),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
