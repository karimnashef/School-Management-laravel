<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinalResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'student' => $this['student'],
            'academic_year' => $this['academic_year'],
            'overall_percentage' => $this['overall_percentage'],
            'pass_mark' => $this['pass_mark'],
            'passed' => $this['passed'],
            'grade_letter' => $this['grade_letter'],
            'subjects' => $this['subjects'],
            'exams' => $this['exams'],
        ];
    }
}