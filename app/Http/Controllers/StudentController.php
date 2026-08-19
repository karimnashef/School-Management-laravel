<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(private readonly StudentService $service) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15))
        );
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new StudentResource($this->service->create($request->validated())),
            'Student created successfully',
            201
        );
    }

    public function show(Student $student): JsonResponse
    {
        return ApiResponse::success(
            new StudentResource($student->load(['user', 'schoolClass.gradeLevel', 'gradeLevel', 'academicYear']))
        );
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        return ApiResponse::success(
            new StudentResource($this->service->update($student, $request->validated())),
            'Student updated successfully'
        );
    }

    public function destroy(Student $student): JsonResponse
    {
        $this->service->delete($student);

        return ApiResponse::success(null, 'Student deleted successfully');
    }

    public function restore(Student $student): JsonResponse
    {
        return ApiResponse::success(
            new StudentResource($this->service->restore($student)),
            'Student restored successfully'
        );
    }
}