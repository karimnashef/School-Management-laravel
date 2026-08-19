<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Resources\FinalResultResource;
use App\Models\AcademicYear;
use App\Models\Student;
use App\Services\FinalResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinalResultController extends Controller
{
    public function __construct(private readonly FinalResultService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('view-any-final-results');

        $students = Student::query()
            ->with(['user', 'schoolClass', 'gradeLevel', 'academicYear'])
            ->when($request->query('class_id'), fn ($query, $classId) => $query->where('class_id', $classId))
            ->when(
                $request->query('academic_year_id'),
                fn ($query, $yearId) => $query->where('academic_year_id', $yearId)
            )
            ->orderBy('id')
            ->paginate((int) $request->query('per_page', 15));

        $year = $request->query('academic_year_id')
            ? AcademicYear::find($request->query('academic_year_id'))
            : null;

        $results = $this->service->forStudents($students->getCollection(), $year);

        return ApiResponse::paginated(
            $students->setCollection(collect($results))
        );
    }

    public function show(Student $student, Request $request): JsonResponse
    {
        $this->authorize('view-final-result', $student);

        $year = $request->query('academic_year_id')
            ? AcademicYear::findOrFail($request->query('academic_year_id'))
            : null;

        return ApiResponse::success(
            new FinalResultResource($this->service->forStudent($student, $year))
        );
    }
}