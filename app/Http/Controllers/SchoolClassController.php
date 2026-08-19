<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\SchoolClass\StoreSchoolClassRequest;
use App\Http\Requests\SchoolClass\UpdateSchoolClassRequest;
use App\Http\Resources\SchoolClassResource;
use App\Models\SchoolClass;
use App\Services\SchoolClassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    public function __construct(private readonly SchoolClassService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SchoolClass::class);

        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15)),
            SchoolClassResource::class
        );
    }

    public function store(StoreSchoolClassRequest $request): JsonResponse
    {
        $this->authorize('create', SchoolClass::class);

        return ApiResponse::success(
            new SchoolClassResource($this->service->create($request->validated())),
            'Class created successfully',
            201
        );
    }

    public function show(SchoolClass $class): JsonResponse
    {
        $this->authorize('view', $class);

        return ApiResponse::success(
            new SchoolClassResource($class->load(['gradeLevel', 'academicYear'])->loadCount('students'))
        );
    }

    public function update(UpdateSchoolClassRequest $request, SchoolClass $class): JsonResponse
    {
        $this->authorize('update', $class);

        return ApiResponse::success(
            new SchoolClassResource($this->service->update($class, $request->validated())),
            'Class updated successfully'
        );
    }

    public function destroy(SchoolClass $class): JsonResponse
    {
        $this->authorize('delete', $class);

        $this->service->delete($class);

        return ApiResponse::success(null, 'Class deleted successfully');
    }
}