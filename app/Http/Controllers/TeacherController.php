<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Teacher\StoreTeacherRequest;
use App\Http\Requests\Teacher\UpdateTeacherRequest;
use App\Http\Resources\TeacherResource;
use App\Models\Teacher;
use App\Services\TeacherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function __construct(private readonly TeacherService $service) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15))
        );
    }

    public function store(StoreTeacherRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new TeacherResource($this->service->create($request->validated())),
            'Teacher created successfully',
            201
        );
    }

    public function show(Teacher $teacher): JsonResponse
    {
        return ApiResponse::success(
            new TeacherResource($teacher->load(['user', 'department']))
        );
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): JsonResponse
    {
        return ApiResponse::success(
            new TeacherResource($this->service->update($teacher, $request->validated())),
            'Teacher updated successfully'
        );
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        $this->service->delete($teacher);

        return ApiResponse::success(null, 'Teacher deleted successfully');
    }
}